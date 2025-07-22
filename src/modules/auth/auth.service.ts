import * as crypto from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokenService } from '../../services/token/token.service';
import { LoginRequest, RegisterRequest } from './auth.dto';
import { PasswordService } from '../../services/password/password.service';
import { User } from '../database/entities/user.entity';
import { MailService } from 'src/services/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly apiUrl: string;
  private readonly verificationUrlBase: string;

  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    const serverUrl = this.configService.get<string>('SERVER_URL');

    if (!serverUrl) {
      throw new Error('SERVER_URL is not set');
    }

    this.apiUrl = serverUrl;
    this.verificationUrlBase = `${this.apiUrl}/api/v1/auth/verify-email`;
  }

  async register(registerRequest: RegisterRequest) {
    const newUser = await this.userService.create(registerRequest);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.userService.update(newUser.username, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const verificationUrl = `${this.verificationUrlBase}?token=${verificationToken}`;

    await this.mailService.sendVerifyEmail(
      newUser.email,
      newUser.username,
      verificationUrl,
    );

    return newUser;
  }

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

  async verifyEmail(token: string) {
    const user = await this.userService.findByVerificationToken(token);

    if (user.emailVerificationExpiresAt < new Date()) {
      throw new UnauthorizedException('Email verification token expired');
    }

    await this.userService.update(user.username, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: undefined,
      emailVerificationExpiresAt: undefined,
    });

    await this.mailService.sendWelcomeEmail(user.email, user.username);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.userService.update(user.username, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const verificationUrl = `${this.verificationUrlBase}?token=${verificationToken}`;

    await this.mailService.sendVerifyEmail(
      user.email,
      user.username,
      verificationUrl,
    );

    return {
      success: true,
      message:
        'Verification email resent. Please check your email for verification.',
    };
  }

  verifyToken(token: string) {
    const decoded = this.tokenService.verifyToken(token);

    if (
      !decoded ||
      !decoded.sub ||
      decoded.exp < Date.now() / 1000 ||
      decoded.iss !== this.apiUrl ||
      decoded.type
    ) {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    return decoded;
  }
}
