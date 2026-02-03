/**
 * Product Category types matching backend DTOs exactly
 * Backend: apps/inventory/src/dto/product-category.dto.ts
 */
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';
import type { ProductCategory } from '../../../../../core/services/product-category/product-category.service';

// Re-export ProductCategory type from service to avoid duplication
export type { ProductCategory };

/**
 * Create Product Category DTO
 */
export interface CreateProductCategoryDto {
  code: string;
  name: string;
  parentId?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  metadata?: Record<string, any>;
}

/**
 * Update Product Category DTO
 */
export type UpdateProductCategoryDto = Partial<CreateProductCategoryDto>;

/**
 * Query parameters for product category list
 */
export interface QueryProductCategoryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  parentId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Product Category list response with pagination
 */
export type ProductCategoryListResponse = ApiPaginatedData<ProductCategory>;

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Parent category option for dropdown
 */
export interface ParentCategoryOption {
  id: string;
  code: string;
  name: string;
  level: number;
  path: string;
}
