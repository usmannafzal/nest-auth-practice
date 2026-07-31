import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { AuthService } from './auth.service';
import { SignupResponseDto } from './dtos/signup-response.dto';
import { Serialize } from '../interceptors/SerializeInterceptor';
import { IsPublic } from './decorators/is-public.decorator';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Serialize(SignupResponseDto)
  @IsPublic()
  @Post('/signup')
  signup(@Body() body: SignUpDto) {
    return this.authService.signup(body);
  }

  @IsPublic()
  @Serialize(SignupResponseDto)
  @Post('/login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @IsPublic()
  @Post('/forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @IsPublic()
  @Post('/reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
