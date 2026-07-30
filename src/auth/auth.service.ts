import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

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
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException('User already exists');
    }
  }

  async signup(body: SignUpDto) {
    const user = await this.createUser(body);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const [accessToken, refreshToken] = await this.generateTokens(user);
    return { user, accessToken, refreshToken };
  }
}
