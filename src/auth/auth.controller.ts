import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { AuthService } from './auth.service';
import { SignupResponseDto } from './dtos/signup-response.dto';
import { Serialize } from '../interceptors/SerializeInterceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Serialize(SignupResponseDto)
  @Post('/signup')
  signup(@Body() body: SignUpDto) {
    return this.authService.signup(body);
  }
}
