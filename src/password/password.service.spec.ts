import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockBcrypt = jest.mocked(bcrypt);

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset NODE_ENV após cada teste
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1); // default rounds
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should hash password with production rounds when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 14); // production rounds
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should hash password with default rounds when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1); // default rounds
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should hash password with default rounds when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1); // default rounds
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = 'hashedEmptyPassword';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const hashedPassword = 'hashedLongPassword';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });

    it('should throw error when bcrypt.hash fails', async () => {
      const password = 'testPassword123';
      const error = new Error('Bcrypt hash failed');

      mockBcrypt.hash.mockRejectedValue(error);

      await expect(service.hash(password)).rejects.toThrow(error);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword123';

      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'testPassword123';
      const hash = 'differentHashedPassword';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hash = 'hashedPassword123';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should handle empty hash comparison', async () => {
      const password = 'testPassword123';
      const hash = '';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should handle both empty password and hash', async () => {
      const password = '';
      const hash = '';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should throw error when bcrypt.compare fails', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword123';
      const error = new Error('Bcrypt compare failed');

      mockBcrypt.compare.mockRejectedValue(error);

      await expect(service.compare(password, hash)).rejects.toThrow(error);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });

  describe('getRoundsByEnvironment', () => {
    it('should return 14 rounds for production environment', async () => {
      process.env.NODE_ENV = 'production';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 14);
    });

    it('should return 1 round for development environment', async () => {
      process.env.NODE_ENV = 'development';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });

    it('should return 1 round for test environment', async () => {
      process.env.NODE_ENV = 'test';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });

    it('should return 1 round for undefined environment', async () => {
      delete process.env.NODE_ENV;
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });

    it('should return 1 round for unknown environment', async () => {
      process.env.NODE_ENV = 'staging';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
    });
  });

  describe('integration tests', () => {
    it('should hash and compare password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      // Mock hash
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      // Mock compare to return true
      mockBcrypt.compare.mockResolvedValue(true as never);

      const hash = await service.hash(password);
      const isMatch = await service.compare(password, hash);

      expect(hash).toBe(hashedPassword);
      expect(isMatch).toBe(true);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 1);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should hash and compare different passwords correctly', async () => {
      const password1 = 'testPassword123';
      const password2 = 'differentPassword456';
      const hashedPassword1 = 'hashedPassword123';

      // Mock hash
      mockBcrypt.hash.mockResolvedValue(hashedPassword1 as never);
      // Mock compare to return false for different passwords
      mockBcrypt.compare.mockResolvedValue(false as never);

      const hash = await service.hash(password1);
      const isMatch = await service.compare(password2, hash);

      expect(hash).toBe(hashedPassword1);
      expect(isMatch).toBe(false);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password1, 1);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        password2,
        hashedPassword1,
      );
    });
  });
});
