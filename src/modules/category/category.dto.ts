import { CategoryType } from '../database/entities/category.entity';
import { ApiMeta } from 'src/app.dto';

export type CreateCategoryRequest = {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
};

export type UpdateCategoryRequest = {
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CategoryResponse = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  parent?: CategoryResponse;
  children?: CategoryResponse[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  transactionCount?: number;
};

export type CategoryListRequest = {
  type?: CategoryType;
  isSystem?: boolean;
  isActive?: boolean;
  parentId?: string;
  includeChildren?: boolean;
  includeTransactionCount?: boolean;
  page?: number;
  limit?: number;
};

export type CategoryListResponse = {
  data: CategoryResponse[];
  meta: ApiMeta;
};

export type CategoryHierarchyResponse = {
  data: CategoryResponse[];
  meta: ApiMeta;
};
