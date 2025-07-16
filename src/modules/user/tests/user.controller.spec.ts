import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { User } from '../../database/entities/user.entity';
import {
  UpdateUserRequest,
  UserResponse,
  UserPagedResponse,
} from '../user.dto';

describe('UserController', () => {
  let controller: UserController;

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

  const expectedUserResponse: UserResponse = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    defaultCurrency: 'BRL',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserService = {
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users successfully', async () => {
      const page = 1;
      const limit = 10;
      const users = [mockUser];
      const total = 1;

      const expectedResponse: UserPagedResponse = {
        success: true,
        data: [expectedUserResponse],
        meta: {
          total,
          page,
          limit,
        },
      };

      mockUserService.findAll.mockResolvedValue({ users, total });

      const result = await controller.findAll(page, limit);

      expect(result).toEqual(expectedResponse);
      expect(mockUserService.findAll).toHaveBeenCalledWith(page, limit);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty paginated response when no users found', async () => {
      const page = 1;
      const limit = 10;
      const users = [];
      const total = 0;

      const expectedResponse: UserPagedResponse = {
        success: true,
        data: [],
        meta: {
          total,
          page,
          limit,
        },
      };

      mockUserService.findAll.mockResolvedValue({ users, total });

      const result = await controller.findAll(page, limit);

      expect(result).toEqual(expectedResponse);
      expect(mockUserService.findAll).toHaveBeenCalledWith(page, limit);
    });

    it('should use default pagination values', async () => {
      const users = [mockUser];
      const total = 1;

      mockUserService.findAll.mockResolvedValue({ users, total });

      await controller.findAll();

      expect(mockUserService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle custom pagination values', async () => {
      const page = 2;
      const limit = 5;
      const users = [mockUser];
      const total = 10;

      mockUserService.findAll.mockResolvedValue({ users, total });

      await controller.findAll(page, limit);

      expect(mockUserService.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockUserService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(mockUserService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findByUsername', () => {
    it('should return user by username successfully', async () => {
      const username = 'testuser';

      mockUserService.findByUsername.mockResolvedValue(mockUser);

      const result = await controller.findByUsername(username);

      expect(result).toEqual(expectedUserResponse);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(username);
      expect(mockUserService.findByUsername).toHaveBeenCalledTimes(1);
    });

    it('should handle user not found', async () => {
      const username = 'nonexistent';
      const error = new NotFoundException('User not found');

      mockUserService.findByUsername.mockRejectedValue(error);

      await expect(controller.findByUsername(username)).rejects.toThrow(error);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(username);
    });

    it('should handle service errors', async () => {
      const username = 'testuser';
      const error = new Error('Database connection failed');

      mockUserService.findByUsername.mockRejectedValue(error);

      await expect(controller.findByUsername(username)).rejects.toThrow(error);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(username);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
        locale: 'en-US',
      };

      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com',
        locale: 'en-US',
        updatedAt: new Date('2023-01-02'),
      };

      const expectedResponse: UserResponse = {
        ...expectedUserResponse,
        email: 'updated@example.com',
        locale: 'en-US',
        updatedAt: new Date('2023-01-02'),
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(username, updateUserRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockUserService.update).toHaveBeenCalledWith(
        username,
        updateUserRequest,
      );
      expect(mockUserService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle partial updates', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        timezone: 'America/New_York',
      };

      const updatedUser: User = {
        ...mockUser,
        timezone: 'America/New_York',
        updatedAt: new Date('2023-01-02'),
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      await controller.update(username, updateUserRequest);

      expect(mockUserService.update).toHaveBeenCalledWith(
        username,
        updateUserRequest,
      );
    });

    it('should handle user not found during update', async () => {
      const username = 'nonexistent';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
      };

      const error = new NotFoundException('User not found');
      mockUserService.update.mockRejectedValue(error);

      await expect(
        controller.update(username, updateUserRequest),
      ).rejects.toThrow(error);
      expect(mockUserService.update).toHaveBeenCalledWith(
        username,
        updateUserRequest,
      );
    });

    it('should handle validation errors during update', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'existing@example.com',
      };

      const error = new Error('Email already in use');
      mockUserService.update.mockRejectedValue(error);

      await expect(
        controller.update(username, updateUserRequest),
      ).rejects.toThrow(error);
      expect(mockUserService.update).toHaveBeenCalledWith(
        username,
        updateUserRequest,
      );
    });

    it('should handle service errors during update', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
      };

      const error = new Error('Database connection failed');
      mockUserService.update.mockRejectedValue(error);

      await expect(
        controller.update(username, updateUserRequest),
      ).rejects.toThrow(error);
      expect(mockUserService.update).toHaveBeenCalledWith(
        username,
        updateUserRequest,
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const username = 'testuser';
      const expectedResponse = {
        success: true,
        message: 'User deleted successfully',
      };

      mockUserService.delete.mockResolvedValue(expectedResponse);

      const result = await controller.delete(username);

      expect(result).toEqual(expectedResponse);
      expect(mockUserService.delete).toHaveBeenCalledWith(username);
      expect(mockUserService.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle user not found during deletion', async () => {
      const username = 'nonexistent';
      const error = new NotFoundException('User not found');

      mockUserService.delete.mockRejectedValue(error);

      await expect(controller.delete(username)).rejects.toThrow(error);
      expect(mockUserService.delete).toHaveBeenCalledWith(username);
    });

    it('should handle service errors during deletion', async () => {
      const username = 'testuser';
      const error = new Error('Database connection failed');

      mockUserService.delete.mockRejectedValue(error);

      await expect(controller.delete(username)).rejects.toThrow(error);
      expect(mockUserService.delete).toHaveBeenCalledWith(username);
    });
  });

  describe('toResponse (private method)', () => {
    it('should convert User entity to UserResponse', async () => {
      const username = 'testuser';
      mockUserService.findByUsername.mockResolvedValue(mockUser);

      const result = await controller.findByUsername(username);

      expect(result).toEqual(expectedUserResponse);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('dateOfBirth');
    });

    it('should handle user with different data', async () => {
      const differentUser: User = {
        ...mockUser,
        id: '3',
        username: 'differentuser',
        email: 'different@example.com',
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
      };

      const expectedDifferentResponse: UserResponse = {
        id: '3',
        username: 'differentuser',
        email: 'different@example.com',
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockUserService.findByUsername.mockResolvedValue(differentUser);

      const result = await controller.findByUsername('differentuser');

      expect(result).toEqual(expectedDifferentResponse);
    });
  });

  describe('toPagedResponse (private method)', () => {
    it('should convert users array to paginated response', async () => {
      const users = [mockUser];
      const total = 1;
      const page = 1;
      const limit = 10;

      mockUserService.findAll.mockResolvedValue({ users, total });

      const result = await controller.findAll(page, limit);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expectedUserResponse);
      expect(result.meta).toEqual({ total, page, limit });
    });

    it('should handle multiple users in paginated response', async () => {
      const user2: User = {
        ...mockUser,
        id: '2',
        username: 'user2',
        email: 'user2@example.com',
      };

      const users = [mockUser, user2];
      const total = 2;
      const page = 1;
      const limit = 10;

      mockUserService.findAll.mockResolvedValue({ users, total });

      const result = await controller.findAll(page, limit);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(expectedUserResponse);
      expect(result.data[1].id).toBe('2');
      expect(result.data[1].username).toBe('user2');
      expect(result.meta).toEqual({ total, page, limit });
    });

    it('should handle empty users array', async () => {
      const users = [];
      const total = 0;
      const page = 1;
      const limit = 10;

      mockUserService.findAll.mockResolvedValue({ users, total });

      const result = await controller.findAll(page, limit);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.meta).toEqual({ total, page, limit });
    });
  });
});
