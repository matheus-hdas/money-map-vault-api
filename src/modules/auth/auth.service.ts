import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokenService } from '../../services/token/token.service';
import { LoginRequest } from './auth.dto';
import { PasswordService } from '../../services/password/password.service';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(loginRequest: LoginRequest) {
    let user: User;

    try {
      user = await this.userService.findByEmail(loginRequest.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid credentials');
      }

      throw error;
    }

    const isPasswordValid = await this.passwordService.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.tokenService.generateAuthorizationToken(user);

    return {
      username: user.username,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiration: token.expiration,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const parsedRefreshToken = refreshToken.split(' ')[1];

    const token =
      await this.tokenService.refreshAuthorizationToken(parsedRefreshToken);

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiration: token.expiration,
    };
  }

  verifyToken(token: string) {
    return this.tokenService.verifyToken(token);
  }
}
