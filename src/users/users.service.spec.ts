import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from './user.dto';

describe('UsersService', () => {
  let service: UsersService;

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

  const mockUserResponse: UserResponse = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const page = 1;
      const limit = 10;
      const total = 1;
      const users = [mockUser];

      mockRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll(page, limit);

      expect(result).toEqual({
        success: true,
        data: [mockUserResponse],
        meta: {
          total,
          page,
          limit,
        },
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
        success: true,
        data: [],
        meta: {
          total,
          page,
          limit,
        },
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

      expect(result.meta).toEqual({
        total,
        page,
        limit,
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

      expect(result).toEqual(mockUserResponse);
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

      const newUser: User = {
        ...mockUser,
        id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
      };

      const expectedResponse: UserResponse = {
        ...mockUserResponse,
        id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
      };

      // Mock para validateUniqueFields - não encontra usuário existente
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createUserRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserRequest.email },
          { username: createUserRequest.username },
        ],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createUserRequest);
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
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
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

      const expectedResponse: UserResponse = {
        ...mockUserResponse,
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

      expect(result).toEqual(expectedResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserRequest,
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

      const expectedResponse: UserResponse = {
        ...mockUserResponse,
        email: 'updated@example.com',
        updatedAt: new Date('2023-01-02'),
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(username, updateUserRequest);

      expect(result).toEqual(expectedResponse);
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
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when user not found', async () => {
      const username = 'nonexistent';
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.delete(username)).rejects.toThrow(NotFoundException);
    });

    it('should delete user successfully', async () => {
      const username = 'testuser';
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue(undefined);

      const result = await service.delete(username);

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
    });
  });
});
