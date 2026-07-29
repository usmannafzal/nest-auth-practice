import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from './user-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
