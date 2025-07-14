import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from './auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() loginRequest: LoginRequest) {
    return this.authService.login(loginRequest);
  }

  @Post('refresh')
  async refreshToken(@Headers('Authorization') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }
}
