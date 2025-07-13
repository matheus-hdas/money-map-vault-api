import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../database/entities/user.entity';
import { CreateUserRequest, UpdateUserRequest } from './user.dto';
import { PasswordService } from '../../services/password/password.service';

describe('UserService', () => {
  let service: UserService;

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

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockPasswordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return users and total', async () => {
      const page = 1;
      const limit = 10;
      const total = 1;
      const users = [mockUser];

      mockRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll(page, limit);

      expect(result).toEqual({
        users,
        total,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: (page - 1) * limit,
        take: limit,
      });
    });

    it('should return empty list when no users found', async () => {
      const page = 1;
      const limit = 10;
      const total = 0;
      const users = [];

      mockRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll(page, limit);

      expect(result).toEqual({
        users: [],
        total: 0,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: (page - 1) * limit,
        take: limit,
      });
    });

    it('should handle different page and limit values', async () => {
      const page = 2;
      const limit = 5;
      const total = 10;
      const users = [mockUser];

      mockRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll(page, limit);

      expect(result).toEqual({
        users,
        total,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: (page - 1) * limit, // skip 5 items
        take: limit,
      });
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const username = 'testuser';
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const username = 'nonexistent';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUsername(username)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const newUser: User = {
        ...mockUser,
        id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
        password: hashedPassword,
      };

      // Mock para validateUniqueFields - não encontra usuário existente
      mockRepository.findOne.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createUserRequest);

      expect(result).toEqual(newUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserRequest.email },
          { username: createUserRequest.username },
        ],
      });
      expect(mockPasswordService.hash).toHaveBeenCalledWith(
        createUserRequest.password,
      );
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createUserRequest,
        password: hashedPassword,
      });
    });

    it('should throw BadRequestException when email already exists', async () => {
      const createUserRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'test@example.com', // email já existente
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserRequest)).rejects.toThrow(
        new BadRequestException('email already in use'),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserRequest.email },
          { username: createUserRequest.username },
        ],
      });
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when username already exists', async () => {
      const createUserRequest: CreateUserRequest = {
        username: 'testuser', // username já existente
        email: 'newemail@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserRequest)).rejects.toThrow(
        new BadRequestException('username already in use'),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserRequest.email },
          { username: createUserRequest.username },
        ],
      });
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when both email and username already exist', async () => {
      const createUserRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserRequest)).rejects.toThrow(
        new BadRequestException('email and username already in use'),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserRequest.email },
          { username: createUserRequest.username },
        ],
      });
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle password hashing error', async () => {
      const createUserRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const hashError = new Error('Password hashing failed');

      mockRepository.findOne.mockResolvedValue(null);
      mockPasswordService.hash.mockRejectedValue(hashError);

      await expect(service.create(createUserRequest)).rejects.toThrow(
        hashError,
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith(
        createUserRequest.password,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user successfully without password', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
      };

      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com',
        locale: 'en-US',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
        updatedAt: new Date('2023-01-02'),
      };

      // Mock para encontrar usuário existente
      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      // Mock para validateUniqueFields - não encontra conflito
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(username, updateUserRequest);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserRequest,
      });
    });

    it('should update user with password hash', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
        password: 'newPassword123',
      };

      const hashedPassword = 'newHashedPassword123';
      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com',
        password: hashedPassword,
        updatedAt: new Date('2023-01-02'),
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(username, updateUserRequest);

      expect(result).toEqual(updatedUser);
      expect(mockPasswordService.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserRequest,
        password: hashedPassword,
      });
    });

    it('should update user with partial data', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
      };

      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com',
        updatedAt: new Date('2023-01-02'),
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(username, updateUserRequest);

      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const username = 'nonexistent';
      const updateUserRequest: UpdateUserRequest = {
        email: 'updated@example.com',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(username, updateUserRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to update to existing email', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        email: 'existing@example.com',
      };

      const existingUserWithEmail: User = {
        ...mockUser,
        id: '2',
        email: 'existing@example.com',
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(existingUserWithEmail);

      await expect(service.update(username, updateUserRequest)).rejects.toThrow(
        new BadRequestException('email already in use'),
      );
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to update to existing username', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        username: 'existinguser',
      };

      const existingUserWithUsername: User = {
        ...mockUser,
        id: '2',
        username: 'existinguser',
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(existingUserWithUsername);

      await expect(service.update(username, updateUserRequest)).rejects.toThrow(
        new BadRequestException('username already in use'),
      );
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle password hashing error during update', async () => {
      const username = 'testuser';
      const updateUserRequest: UpdateUserRequest = {
        password: 'newPassword123',
      };

      const hashError = new Error('Password hashing failed');

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockPasswordService.hash.mockRejectedValue(hashError);

      await expect(service.update(username, updateUserRequest)).rejects.toThrow(
        hashError,
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when user not found', async () => {
      const username = 'nonexistent';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(username)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete user successfully', async () => {
      const username = 'testuser';
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(username);

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle repository delete errors', async () => {
      const username = 'testuser';
      const deleteError = new Error('Database delete failed');

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.delete.mockRejectedValue(deleteError);

      await expect(service.delete(username)).rejects.toThrow(deleteError);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
