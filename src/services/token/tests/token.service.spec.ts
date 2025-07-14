import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token.service';
import { User } from '../../../modules/database/entities/user.entity';

describe('TokenService', () => {
  let service: TokenService;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    dateOfBirth: new Date('1990-01-01'),
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    defaultCurrency: 'BRL',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthorizationToken', () => {
    it('should generate access and refresh tokens successfully', () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken) // Para access token
        .mockReturnValueOnce(mockRefreshToken); // Para refresh token

      const result = service.generateAuthorizationToken(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiration: expect.any(Number),
      });

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);

      // Verificar chamada do access token
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        currency: mockUser.defaultCurrency,
      });

      // Verificar chamada do refresh token
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockUser.username,
          iss: 'moneymapvault-api',
          type: 'refresh',
        },
        {
          expiresIn: 86400,
        },
      );

      // Verificar se o expiration está no futuro
      expect(result.expiration).toBeGreaterThan(Date.now());
    });

    it('should generate tokens with correct expiration time', () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const beforeCall = Date.now();
      const result = service.generateAuthorizationToken(mockUser);
      const afterCall = Date.now();

      // Verifica se o expiration está entre beforeCall + 3600s e afterCall + 3600s
      const expectedMinExpiration = beforeCall + 3600 * 1000;
      const expectedMaxExpiration = afterCall + 3600 * 1000;

      expect(result.expiration).toBeGreaterThanOrEqual(expectedMinExpiration);
      expect(result.expiration).toBeLessThanOrEqual(expectedMaxExpiration);
    });
  });

  describe('refreshAuthorizationToken', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockDecodedToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      mockJwtService.verify.mockReturnValue(mockDecodedToken);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce(mockNewAccessToken)
        .mockReturnValueOnce(mockNewRefreshToken);

      const result = await service.refreshAuthorizationToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
        expiration: expect.any(Number),
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: mockUser.username },
      });
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      const mockRefreshToken = 'invalid-token';
      const mockDecodedToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        type: 'access', // Tipo inválido
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      await expect(
        service.refreshAuthorizationToken(mockRefreshToken),
      ).rejects.toThrow(new UnauthorizedException('Invalid token type'));

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for missing token type', async () => {
      const mockRefreshToken = 'invalid-token';
      const mockDecodedToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        // type ausente
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      await expect(
        service.refreshAuthorizationToken(mockRefreshToken),
      ).rejects.toThrow(new UnauthorizedException('Invalid token type'));

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockDecodedToken = {
        sub: 'nonexistent-user',
        iss: 'moneymapvault-api',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      mockJwtService.verify.mockReturnValue(mockDecodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshAuthorizationToken(mockRefreshToken),
      ).rejects.toThrow(new UnauthorizedException('Invalid token user'));

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent-user' },
      });
    });

    it('should handle JWT verification errors', async () => {
      const mockRefreshToken = 'malformed-token';
      const jwtError = new Error('Invalid token');

      mockJwtService.verify.mockImplementation(() => {
        throw jwtError;
      });

      await expect(
        service.refreshAuthorizationToken(mockRefreshToken),
      ).rejects.toThrow(jwtError);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        currency: mockUser.defaultCurrency,
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      const result = service.verifyToken(mockToken);

      expect(result).toEqual(mockDecodedToken);
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken);
    });

    it('should throw error for invalid token', () => {
      const mockToken = 'invalid-token';
      const jwtError = new Error('Invalid token');

      mockJwtService.verify.mockImplementation(() => {
        throw jwtError;
      });

      expect(() => service.verifyToken(mockToken)).toThrow(jwtError);
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken);
    });

    it('should throw error for expired token', () => {
      const mockToken = 'expired-token';
      const jwtError = new Error('Token expired');

      mockJwtService.verify.mockImplementation(() => {
        throw jwtError;
      });

      expect(() => service.verifyToken(mockToken)).toThrow(jwtError);
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('integration tests', () => {
    it('should generate and verify token successfully', () => {
      const mockAccessToken = 'generated-access-token';
      const mockRefreshToken = 'generated-refresh-token';
      const mockDecodedToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        currency: mockUser.defaultCurrency,
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      // Mock para generation
      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      // Mock para verification
      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      const generatedTokens = service.generateAuthorizationToken(mockUser);
      const verifiedToken = service.verifyToken(generatedTokens.accessToken);

      expect(generatedTokens.accessToken).toBe(mockAccessToken);
      expect(verifiedToken).toEqual(mockDecodedToken);
    });

    it('should generate and refresh token successfully', async () => {
      const mockAccessToken = 'generated-access-token';
      const mockRefreshToken = 'generated-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';
      const mockDecodedRefreshToken = {
        sub: mockUser.username,
        iss: 'moneymapvault-api',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      // Mock para generation inicial
      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      // Mock para refresh
      mockJwtService.verify.mockReturnValue(mockDecodedRefreshToken);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce(mockNewAccessToken)
        .mockReturnValueOnce(mockNewRefreshToken);

      const initialTokens = service.generateAuthorizationToken(mockUser);
      const refreshedTokens = await service.refreshAuthorizationToken(
        initialTokens.refreshToken,
      );

      expect(refreshedTokens.accessToken).toBe(mockNewAccessToken);
      expect(refreshedTokens.refreshToken).toBe(mockNewRefreshToken);
      expect(refreshedTokens.expiration).toBeGreaterThan(Date.now());
    });
  });
});
