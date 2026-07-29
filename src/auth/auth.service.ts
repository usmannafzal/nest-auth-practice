import { User } from 'src/users/user.entity';
import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async createUser(body: SignUpDto) {
    const hashedPassword = bcrypt.hashSync(body.password, 10);
    body.password = hashedPassword;
    const user = this.repo.create(body);

    const [accessToken, refreshToken] = await Promise.all([
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
}
