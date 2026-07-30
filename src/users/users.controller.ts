import { Controller, Req, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/my-profile')
  getmyProfile(@Req() req: any) {
    return this.usersService.findbyId(req.user.id);
  }
}
