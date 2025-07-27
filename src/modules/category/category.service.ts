import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  CategoryListRequest,
  CategoryListResponse,
  CategoryHierarchyResponse,
} from './category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    userId: string,
    createCategoryRequest: CreateCategoryRequest,
  ): Promise<CategoryResponse> {
    const { parentId, ...categoryData } = createCategoryRequest;

    // Validar parent se fornecido
    if (parentId) {
      await this.validateParentAccess(userId, parentId);
      await this.validateNoCircularReference(parentId, null);
    }

    // Criar categoria
    const category = this.categoryRepository.create({
      ...categoryData,
      parentId,
      userId,
      isSystem: false, // Categorias do usuário nunca são sistema
    });

    const savedCategory = await this.categoryRepository.save(category);
    return this.mapToResponse(savedCategory);
  }

  async findAll(
    userId: string,
    query: CategoryListRequest = {},
  ): Promise<CategoryListResponse> {
    const {
      type,
      isSystem,
      isActive = true,
      parentId,
      includeChildren = false,
      includeTransactionCount = false,
      page = 1,
      limit = 50,
    } = query;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    // Filtrar por categorias acessíveis ao usuário
    queryBuilder.where(
      '(category.isSystem = true OR category.userId = :userId)',
      { userId },
    );

    // Aplicar filtros
    if (type) {
      queryBuilder.andWhere('category.type = :type', { type });
    }

    if (isSystem !== undefined) {
      queryBuilder.andWhere('category.isSystem = :isSystem', { isSystem });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('category.parentId IS NULL');
      } else {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId });
      }
    }

    // Incluir relacionamentos se necessário
    if (includeChildren) {
      queryBuilder.leftJoinAndSelect('category.children', 'children');
    }

    // Ordenação
    queryBuilder.orderBy('category.sortOrder', 'ASC');
    queryBuilder.addOrderBy('category.name', 'ASC');

    // Paginação
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    // Incluir contagem de transações se solicitado
    const data = await Promise.all(
      categories.map(async (category) => {
        const response = this.mapToResponse(category);
        if (includeTransactionCount) {
          response.transactionCount = await this.getTransactionCount(
            category.id,
          );
        }
        return response;
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(userId: string, id: string): Promise<CategoryResponse> {
    const category = await this.findByIdWithAccessCheck(userId, id);
    return this.mapToResponse(category);
  }

  async findHierarchy(userId: string): Promise<CategoryHierarchyResponse> {
    // Buscar todas as categorias acessíveis
    const categories = await this.categoryRepository.find({
      where: [{ isSystem: true }, { userId }],
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['children'],
    });

    // Filtrar apenas categorias raiz e construir hierarquia
    const rootCategories = categories.filter((cat) => !cat.parentId);
    const data = rootCategories.map((cat) =>
      this.buildHierarchy(cat, categories),
    );

    return {
      data,
      meta: {
        total: rootCategories.length,
        page: 1,
        limit: rootCategories.length,
      },
    };
  }

  async update(
    userId: string,
    id: string,
    updateCategoryRequest: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    const category = await this.findByIdWithAccessCheck(userId, id);

    // Verificar se é categoria do sistema (não pode ser editada)
    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be modified');
    }

    const { parentId, ...categoryData } = updateCategoryRequest;

    // Validar parent se fornecido
    if (parentId !== undefined) {
      if (parentId) {
        await this.validateParentAccess(userId, parentId);
        await this.validateNoCircularReference(parentId, id);
      }
      category.parentId = parentId;
    }

    // Atualizar campos
    Object.assign(category, categoryData);

    const savedCategory = await this.categoryRepository.save(category);
    return this.mapToResponse(savedCategory);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findByIdWithAccessCheck(userId, id);

    // Verificar se é categoria do sistema (não pode ser deletada)
    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be deleted');
    }

    // Deletar categoria (TypeORM fará SET NULL automaticamente)
    await this.categoryRepository.delete(id);
  }

  async findByIdWithAccessCheck(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verificar acesso: sistema ou própria do usuário
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Access denied to this category');
    }

    return category;
  }

  private async validateParentAccess(
    userId: string,
    parentId: string,
  ): Promise<void> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
    });

    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }

    // Verificar se o usuário tem acesso ao parent
    if (!parent.isSystem && parent.userId !== userId) {
      throw new ForbiddenException('Access denied to parent category');
    }
  }

  private async validateNoCircularReference(
    parentId: string,
    categoryId: string | null,
  ): Promise<void> {
    if (!categoryId) return;

    let currentParentId = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException('Circular reference detected');
      }

      if (currentParentId === categoryId) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      visited.add(currentParentId);

      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
        select: ['parentId'],
      });

      if (!parent) break;
      currentParentId = parent.parentId;
    }
  }

  private async getTransactionCount(categoryId: string): Promise<number> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.transactions', 'transaction')
      .select('COUNT(transaction.id)', 'count')
      .where('category.id = :categoryId', { categoryId })
      .getRawOne();

    return parseInt(result.count as string) || 0;
  }

  private buildHierarchy(
    category: Category,
    allCategories: Category[],
  ): CategoryResponse {
    const response = this.mapToResponse(category);

    // Buscar filhos recursivamente
    const children = allCategories.filter(
      (cat) => cat.parentId === category.id,
    );
    if (children.length > 0) {
      response.children = children.map((child) =>
        this.buildHierarchy(child, allCategories),
      );
    }

    return response;
  }

  private mapToResponse(category: Category): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      description: category.description,
      isSystem: category.isSystem,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      parent: category.parent ? this.mapToResponse(category.parent) : undefined,
      children: category.children?.map((child) => this.mapToResponse(child)),
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
