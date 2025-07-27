import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  CategoryListRequest,
  CategoryListResponse,
  CategoryHierarchyResponse,
} from './category.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  ResourceOwner,
  ResourceOwnerGuard,
} from '../../common/guards/resource-owner.guard';
import { AuthenticatedRequest } from '../../common/types/request.type';

@Controller('api/v1/categories')
@UseGuards(AuthGuard, ResourceOwnerGuard)
@ResourceOwner({ entity: 'category' })
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(ValidationPipe) createCategoryRequest: CreateCategoryRequest,
  ): Promise<CategoryResponse> {
    return this.categoryService.create(req.user.sub, createCategoryRequest);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: CategoryListRequest,
  ): Promise<CategoryListResponse> {
    const userId = req.user.sub;
    return this.categoryService.findAll(userId, query);
  }

  @Get('hierarchy')
  async findHierarchy(
    @Req() req: AuthenticatedRequest,
  ): Promise<CategoryHierarchyResponse> {
    const userId = req.user.sub;
    return this.categoryService.findHierarchy(userId);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<CategoryResponse> {
    const userId = req.user.sub;
    return this.categoryService.findOne(userId, id);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCategoryRequest: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    const userId = req.user.sub;
    return this.categoryService.update(userId, id, updateCategoryRequest);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user.sub;
    return this.categoryService.remove(userId, id);
  }
}
