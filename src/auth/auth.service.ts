import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { PasswordResetToken } from './password-reset-token.entity';
import { UserSession } from './user-session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generateTokens(user: User) {
    return Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email },
        { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: '15m' },
      ),
      this.jwt.signAsync(
        { sub: user.id, email: user.email },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
      ),
    ]);
  }

  async createUser(body: SignUpDto) {
    try {
      const hashedPassword = bcrypt.hashSync(body.password, 10);
      body.password = hashedPassword;
      const user = this.repo.create(body);
      return await this.repo.save(user);
    } catch (error: any) {
      if (error?.code === '23505')
        throw new ConflictException('User already exists');
      throw error;
    }
  }

  async signup(body: SignUpDto) {
    const user = await this.createUser(body);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isStaging = this.config.get('NODE_ENV') === 'staging';
    if (!isStaging)
      await this.mailService.sendEmail({
        to: user.email,
        subject: 'Greetings from Nest Auth',
        text: 'This is a test application for sending emails',
        html: `<p>Welcome to our app ${user.fullName}</p>`,
      });
    const [accessToken, refreshToken] = await this.generateTokens(user);
    return { user, accessToken, refreshToken };
  }

  async login(body: LoginDto) {
    const user = await this.repo.findOne({ where: { email: body.email } });
    if (!user) throw new NotFoundException('Invalid credentials');

    const isPasswordValid = await bcrypt.compareSync(
      body.password,
      user.password,
    );
    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    const [accessToken, refreshToken] = await this.generateTokens(user);

    return { user, accessToken, refreshToken };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const message = 'If that email exists, we sent a reset link';
    const user = await this.repo.findOne({ where: { email: body.email } });

    if (!user) {
      return { message };
    }

    // Invalidate any unused tokens for this user
    const existingTokens = await this.resetTokenRepo.find({
      where: { user: { id: user.id }, usedAt: IsNull() },
    });
    if (existingTokens.length) {
      for (const token of existingTokens) {
        token.usedAt = new Date();
      }
      await this.resetTokenRepo.save(existingTokens);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const resetToken = this.resetTokenRepo.create({
      tokenHash,
      expiresAt,
      usedAt: null,
      user,
    });
    await this.resetTokenRepo.save(resetToken);

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Reset your password using this link (expires in 15 minutes): ${link}`,
      html: `<p>Click the link below to reset your password. It expires in 15 minutes.</p>
             <p><a href="${link}">Reset password</a></p>
             <p>If you did not request this, you can ignore this email.</p>`,
    });

    return { message };
  }

  async resetPassword(body: ResetPasswordDto) {
    const tokenHash = this.hashToken(body.token);
    const record = await this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    record.user.password = bcrypt.hashSync(body.newPassword, 10);
    record.usedAt = new Date();

    await this.repo.save(record.user);
    await this.resetTokenRepo.save(record);

    // Invalidate any other unused reset tokens for this user
    const otherTokens = await this.resetTokenRepo.find({
      where: { user: { id: record.user.id }, usedAt: IsNull() },
    });
    if (otherTokens.length) {
      for (const token of otherTokens) {
        token.usedAt = new Date();
      }
      await this.resetTokenRepo.save(otherTokens);
    }

    // Revoke existing sessions so old tokens can't be used after password change
    const sessions = await this.sessionRepo.find({
      where: { user: { id: record.user.id }, revoked: false },
    });
    if (sessions.length) {
      for (const session of sessions) {
        session.revoked = true;
      }
      await this.sessionRepo.save(sessions);
    }

    return { message: 'Password reset successfully' };
  }
}
