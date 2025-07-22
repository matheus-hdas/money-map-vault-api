import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../modules/database/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

type TokenPayload = {
  sub: string;
  usr?: string;
  currency?: string;
  iss: string;
  type?: string;
};

type DecodedTokenPayload = TokenPayload & {
  iat: number;
  exp: number;
};

export type TokenObject = {
  accessToken: string;
  refreshToken: string;
  expiration: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  generateAuthorizationToken(user: User): TokenObject {
    const accessTokenExpiresInSeconds = 3600;
    const tokenExpiration = new Date();
    tokenExpiration.setSeconds(
      tokenExpiration.getSeconds() + accessTokenExpiresInSeconds,
    );

    const accessTokenPayload: TokenPayload = {
      sub: user.id,
      usr: user.username,
      iss: 'moneymapvault-api',
      currency: user.defaultCurrency,
    };

    const refreshTokenPayload: TokenPayload = {
      sub: user.id,
      iss: 'moneymapvault-api',
      type: 'refresh',
    };

    const accessToken = this.getAccessToken(accessTokenPayload);
    const refreshToken = this.getRefreshToken(refreshTokenPayload);

    return {
      accessToken,
      refreshToken,
      expiration: tokenExpiration.getTime(),
    };
  }

  async refreshAuthorizationToken(token: string): Promise<TokenObject> {
    const decoded: DecodedTokenPayload = this.jwtService.verify(token);

    if (!decoded.type || decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token user');
    }

    return this.generateAuthorizationToken(user);
  }

  verifyToken(token: string): DecodedTokenPayload {
    return this.jwtService.verify(token);
  }

  private getAccessToken(payload: TokenPayload) {
    return this.jwtService.sign(payload);
  }

  private getRefreshToken(payload: TokenPayload) {
    const refreshExpiresInSeconds = 86400;

    return this.jwtService.sign(payload, {
      expiresIn: refreshExpiresInSeconds,
    });
  }
}
