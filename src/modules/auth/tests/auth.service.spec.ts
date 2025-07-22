import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { TokenService } from '../../../services/token/token.service';
import { PasswordService } from '../../../services/password/password.service';
import { LoginRequest, RegisterRequest } from '../auth.dto';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../../../services/mail/mail.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    dateOfBirth: new Date('1990-01-01'),
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    defaultCurrency: 'BRL',
    emailVerified: false,
    emailVerifiedAt: null as any,
    emailVerificationToken: 'verification-token-123',
    emailVerificationExpiresAt: new Date('2023-01-02'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockTokenObject = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiration: Date.now() + 3600000,
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByVerificationToken: jest.fn(),
  };

  const mockTokenService = {
    generateAuthorizationToken: jest.fn(),
    refreshAuthorizationToken: jest.fn(),
  };

  const mockPasswordService = {
    compare: jest.fn(),
  };

  const mockMailService = {
    sendVerifyEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SERVER_URL') return 'http://localhost:3000';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const mockRegisterRequest: RegisterRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      defaultCurrency: 'BRL',
    };

    it('should register user successfully', async () => {
      const mockCreatedUser = {
        ...mockUser,
        emailVerified: false,
      };

      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(mockRegisterRequest);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserService.create).toHaveBeenCalledWith(mockRegisterRequest);
    });

    it('should handle user creation errors', async () => {
      const creationError = new Error('Database error');
      mockUserService.create.mockRejectedValue(creationError);

      await expect(service.register(mockRegisterRequest)).rejects.toThrow(
        creationError,
      );

      expect(mockUserService.create).toHaveBeenCalledWith(mockRegisterRequest);
    });

    it('should register user with optional fields', async () => {
      const minimalRegisterRequest: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        ...mockUser,
        emailVerified: false,
      };

      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(minimalRegisterRequest);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserService.create).toHaveBeenCalledWith(
        minimalRegisterRequest,
      );
    });

    it('should register user with custom locale and timezone', async () => {
      const customRegisterRequest: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
      };

      const mockCreatedUser = {
        ...mockUser,
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
        emailVerified: false,
      };

      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(customRegisterRequest);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserService.create).toHaveBeenCalledWith(
        customRegisterRequest,
      );
    });

    it('should handle validation errors from UserService', async () => {
      const validationError = new Error('Email already exists');
      mockUserService.create.mockRejectedValue(validationError);

      await expect(service.register(mockRegisterRequest)).rejects.toThrow(
        validationError,
      );

      expect(mockUserService.create).toHaveBeenCalledWith(mockRegisterRequest);
    });
  });

  describe('login', () => {
    const mockLoginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAuthorizationToken.mockReturnValue(
        mockTokenObject,
      );

      const result = await service.login(mockLoginRequest);

      expect(result).toEqual({
        username: mockUser.username,
        accessToken: mockTokenObject.accessToken,
        refreshToken: mockTokenObject.refreshToken,
        expiration: mockTokenObject.expiration,
      });

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        mockLoginRequest.password,
        mockUser.password,
      );
      expect(mockTokenService.generateAuthorizationToken).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserService.findByEmail.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(
        mockTokenService.generateAuthorizationToken,
      ).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        mockLoginRequest.password,
        mockUser.password,
      );
      expect(
        mockTokenService.generateAuthorizationToken,
      ).not.toHaveBeenCalled();
    });

    it('should rethrow other errors from userService', async () => {
      const databaseError = new Error('Database connection failed');
      mockUserService.findByEmail.mockRejectedValue(databaseError);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        databaseError,
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(
        mockTokenService.generateAuthorizationToken,
      ).not.toHaveBeenCalled();
    });

    it('should handle password comparison errors', async () => {
      const passwordError = new Error('Password service error');
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockRejectedValue(passwordError);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        passwordError,
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        mockLoginRequest.password,
        mockUser.password,
      );
      expect(
        mockTokenService.generateAuthorizationToken,
      ).not.toHaveBeenCalled();
    });

    it('should handle token generation errors', async () => {
      const tokenError = new Error('Token generation failed');
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAuthorizationToken.mockImplementation(() => {
        throw tokenError;
      });

      await expect(service.login(mockLoginRequest)).rejects.toThrow(tokenError);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginRequest.email,
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        mockLoginRequest.password,
        mockUser.password,
      );
      expect(mockTokenService.generateAuthorizationToken).toHaveBeenCalledWith(
        mockUser,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'Bearer valid-refresh-token';
      const mockNewTokenObject = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiration: Date.now() + 3600000,
      };

      mockTokenService.refreshAuthorizationToken.mockResolvedValue(
        mockNewTokenObject,
      );

      const result = await service.refreshToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockNewTokenObject.accessToken,
        refreshToken: mockNewTokenObject.refreshToken,
        expiration: mockNewTokenObject.expiration,
      });

      expect(mockTokenService.refreshAuthorizationToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });

    it('should throw UnauthorizedException when refresh token is not provided', async () => {
      await expect(service.refreshToken('')).rejects.toThrow(
        new UnauthorizedException('No refresh token provided'),
      );

      expect(mockTokenService.refreshAuthorizationToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is null', async () => {
      await expect(
        service.refreshToken(null as unknown as string),
      ).rejects.toThrow(new UnauthorizedException('No refresh token provided'));

      expect(mockTokenService.refreshAuthorizationToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is undefined', async () => {
      await expect(
        service.refreshToken(undefined as unknown as string),
      ).rejects.toThrow(new UnauthorizedException('No refresh token provided'));

      expect(mockTokenService.refreshAuthorizationToken).not.toHaveBeenCalled();
    });

    it('should parse Bearer token correctly', async () => {
      const mockRefreshToken = 'Bearer valid-refresh-token';
      const mockNewTokenObject = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiration: Date.now() + 3600000,
      };

      mockTokenService.refreshAuthorizationToken.mockResolvedValue(
        mockNewTokenObject,
      );

      await service.refreshToken(mockRefreshToken);

      expect(mockTokenService.refreshAuthorizationToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });

    it('should handle token without Bearer prefix', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockNewTokenObject = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiration: Date.now() + 3600000,
      };

      mockTokenService.refreshAuthorizationToken.mockResolvedValue(
        mockNewTokenObject,
      );

      await service.refreshToken(mockRefreshToken);

      // Se não tem Bearer, split(' ')[1] retorna undefined
      expect(mockTokenService.refreshAuthorizationToken).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should handle token service errors', async () => {
      const mockRefreshToken = 'Bearer invalid-refresh-token';
      const tokenError = new UnauthorizedException('Invalid refresh token');

      mockTokenService.refreshAuthorizationToken.mockRejectedValue(tokenError);

      await expect(service.refreshToken(mockRefreshToken)).rejects.toThrow(
        tokenError,
      );

      expect(mockTokenService.refreshAuthorizationToken).toHaveBeenCalledWith(
        'invalid-refresh-token',
      );
    });
  });

  describe('integration tests', () => {
    it('should perform complete login flow', async () => {
      const mockLoginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAuthorizationToken.mockReturnValue(
        mockTokenObject,
      );

      const loginResult = await service.login(mockLoginRequest);

      expect(loginResult).toEqual({
        username: mockUser.username,
        accessToken: mockTokenObject.accessToken,
        refreshToken: mockTokenObject.refreshToken,
        expiration: mockTokenObject.expiration,
      });

      // Simular refresh do token
      const mockNewTokenObject = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiration: Date.now() + 3600000,
      };

      mockTokenService.refreshAuthorizationToken.mockResolvedValue(
        mockNewTokenObject,
      );

      const refreshResult = await service.refreshToken(
        `Bearer ${loginResult.refreshToken}`,
      );

      expect(refreshResult).toEqual({
        accessToken: mockNewTokenObject.accessToken,
        refreshToken: mockNewTokenObject.refreshToken,
        expiration: mockNewTokenObject.expiration,
      });
    });

    it('should handle login failure and not proceed to refresh', async () => {
      const mockLoginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(
        mockTokenService.generateAuthorizationToken,
      ).not.toHaveBeenCalled();
    });
  });
});
