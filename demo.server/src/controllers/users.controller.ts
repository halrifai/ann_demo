import { Controller, Post, Body, UseGuards, Get, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ok } from 'assert';
interface RegisterResponse {
  message: string;
  statusCode: number;
}
@Controller('users')
export class UsersController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('email') email: string,
    @Body('dateOfBirth') dateOfBirth: Date,
  ): Promise<RegisterResponse> {
    await this.authService.register(username, password, email, dateOfBirth);
    
    return {
      message: 'User Has Been Registered!',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(username, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile() {
    return { message: 'test' };
  }
}