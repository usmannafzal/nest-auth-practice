import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from './user-session.entity';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession]), MailModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
