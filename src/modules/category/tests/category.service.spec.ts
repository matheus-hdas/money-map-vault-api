import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CategoryService } from '../category.service';
import {
  Category,
  CategoryType,
} from '../../database/entities/category.entity';
import { CreateCategoryRequest, UpdateCategoryRequest } from '../category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const createMockQueryBuilder = (
    result: any[],
  ): jest.Mocked<SelectQueryBuilder<Category>> =>
    ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue(result),
    }) as unknown as jest.Mocked<SelectQueryBuilder<Category>>;

  const mockCategory = {
    id: 'category-1',
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    color: '#FF5722',
    icon: 'restaurant',
    description: 'Gastos com alimentação',
    isSystem: false,
    isActive: true,
    sortOrder: 1,
    parentId: 'parent-1',
    userId: 'user-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockSystemCategory = {
    id: 'system-category-1',
    name: 'Essenciais',
    type: CategoryType.EXPENSE,
    color: '#F44336',
    icon: 'home',
    description: 'Gastos essenciais',
    isSystem: true,
    isActive: true,
    sortOrder: 1,
    parentId: 'system-parent',
    userId: 'system-user',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user category successfully', async () => {
      const createRequest: CreateCategoryRequest = {
        name: 'Teste Categoria',
        type: CategoryType.EXPENSE,
        color: '#FF0000',
        icon: 'test',
        description: 'Categoria de teste',
      };

      categoryRepository.create.mockReturnValue(mockCategory);
      categoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create('user-1', createRequest);

      expect(result.id).toBe('category-1');
      expect(result.name).toBe('Alimentação');
      expect(result.isSystem).toBe(false);
    });

    it('should throw error when parent category not found', async () => {
      const createRequest: CreateCategoryRequest = {
        name: 'Subcategoria',
        type: CategoryType.EXPENSE,
        parentId: 'nonexistent-parent',
      };

      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', createRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return user and system categories', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        [mockCategory, mockSystemCategory],
        2,
      ]);

      categoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('user-1');

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should find user category', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('user-1', 'category-1');

      expect(result.id).toBe('category-1');
      expect(result.name).toBe('Alimentação');
    });

    it('should find system category', async () => {
      categoryRepository.findOne.mockResolvedValue(mockSystemCategory);

      const result = await service.findOne('user-1', 'system-category-1');

      expect(result.id).toBe('system-category-1');
      expect(result.isSystem).toBe(true);
    });

    it('should throw error when category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findHierarchy', () => {
    it('should return categories hierarchy', async () => {
      const parentCategory = {
        ...mockCategory,
        id: 'parent-1',
        parentId: 'root',
      };
      const childCategory = {
        ...mockCategory,
        id: 'child-1',
        parentId: 'parent-1',
      };

      categoryRepository.find.mockResolvedValue([
        parentCategory,
        childCategory,
      ]);

      const result = await service.findHierarchy('user-1');

      expect(result.data).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update user category successfully', async () => {
      const updateRequest: UpdateCategoryRequest = {
        name: 'Nome Atualizado',
        color: '#00FF00',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateRequest,
      });

      const result = await service.update(
        'user-1',
        'category-1',
        updateRequest,
      );

      expect(result.name).toBe('Nome Atualizado');
      expect(result.color).toBe('#00FF00');
    });

    it('should throw error when trying to update system category', async () => {
      const updateRequest: UpdateCategoryRequest = {
        name: 'Tentativa de atualização',
      };

      categoryRepository.findOne.mockResolvedValue(mockSystemCategory);

      await expect(
        service.update('user-1', 'system-category-1', updateRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete user category successfully', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      const deleteSpy = jest.spyOn(categoryRepository, 'delete');
      deleteSpy.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('user-1', 'category-1');

      expect(deleteSpy).toHaveBeenCalledWith('category-1');
    });

    it('should throw error when trying to delete system category', async () => {
      categoryRepository.findOne.mockResolvedValue(mockSystemCategory);

      await expect(
        service.remove('user-1', 'system-category-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByIdWithAccessCheck', () => {
    it('should allow access to user own category', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findByIdWithAccessCheck(
        'user-1',
        'category-1',
      );

      expect(result).toEqual(mockCategory);
    });

    it('should allow access to system category', async () => {
      categoryRepository.findOne.mockResolvedValue(mockSystemCategory);

      const result = await service.findByIdWithAccessCheck(
        'user-1',
        'system-category-1',
      );

      expect(result).toEqual(mockSystemCategory);
    });
  });
});
