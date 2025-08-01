import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest } from './auth.dto';
import { UserResponse } from '../user/user.dto';
import { User } from '../database/entities/user.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerRequest: RegisterRequest) {
    const user = await this.authService.register(registerRequest);

    return {
      user: this.toResponse(user),
      message:
        'User created successfully. Please check your email for verification.',
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() loginRequest: LoginRequest) {
    return await this.authService.login(loginRequest);
  }

  @Post('refresh')
  async refreshToken(@Headers('Authorization') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      locale: user.locale,
      timezone: user.timezone,
      defaultCurrency: user.defaultCurrency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
