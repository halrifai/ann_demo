import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Delete,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('email') email: string,
    @Body('dateOfBirth') dateOfBirth: Date,
  ) {
    return this.authService.register(username, password, email, dateOfBirth);
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(username, password);
  }

  @Delete('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId);
    return { message: 'logged out' };
  }

  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('verify')
  async verifyAccessToken(@Body('access_token') accessToken: string) {
    return this.authService.verifyAccessToken(accessToken);
  }
}
