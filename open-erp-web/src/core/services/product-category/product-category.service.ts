import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_PLATFORM } from '../../constant';
import { ApiResponse, ApiPaginatedResponse } from '../../api/interfaces';

/**
 * Product Category interface matching backend schema
 */
export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  path: string;
  level: number;
  description?: string;
  isActive: boolean;
  order: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  metadata?: Record<string, any>;
}

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
  sort?: string; // Array format: [field1,order1,field2,order2,...]
}

/**
 * Product Category Tree Node (for tree view)
 */
export interface ProductCategoryTreeNode extends ProductCategory {
  children?: ProductCategoryTreeNode[];
}

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Product Category service - handles all product category-related API calls
 * Backend: platform-service port 3007 — /v1/platform/catalog-items?catalog_type=category
 */
@Injectable({
  providedIn: 'root',
})
export class ProductCategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_PLATFORM}/v1/platform/catalog-items`;

  /** Map CatalogItem (platform-service schema) sang ProductCategory interface. */
  private mapToProductCategory(item: any): ProductCategory {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      parentId: item.parent_id,
      path: item.id,
      level: 0,
      description: item.metadata?.['description'] as string | undefined,
      isActive: item.status === 'active',
      order: (item.metadata?.['order'] as number) ?? 0,
      createdBy: item.tenant_id ?? '',
      updatedBy: item.tenant_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deletedAt: null,
      metadata: item.metadata,
    };
  }

  /**
   * Get all product categories with filtering and pagination
   * GET /config/product-categories
   */
  getProductCategories(
    params: QueryProductCategoryParams,
  ): Observable<{ items: ProductCategory[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('catalog_type', 'category');

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.isActive !== undefined)
      httpParams = httpParams.set('status', params.isActive ? 'active' : 'inactive');
    if (params.parentId) httpParams = httpParams.set('parentId', params.parentId);
    if (params.search) httpParams = httpParams.set('q', params.search);

    return this.http
      .get<ApiPaginatedResponse<any>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: (response.data?.items || []).map((i: any) => this.mapToProductCategory(i)),
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 10,
        })),
      );
  }

  /**
   * Get product category by ID
   * GET /config/product-categories/:id
   */
  getProductCategoryById(id: string): Observable<ProductCategory | null> {
    return this.http
      .get<ApiResponse<{ mode: string; item: any }>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => (response.data?.item ? this.mapToProductCategory(response.data.item) : null)));
  }

  /**
   * Create new product category
   * POST /config/product-categories
   */
  createProductCategory(dto: CreateProductCategoryDto): Observable<ProductCategory> {
    const payload = {
      catalogType: 'category' as const,
      code: dto.code,
      name: dto.name,
      parentId: dto.parentId,
      status: dto.isActive === false ? 'inactive' as const : 'active' as const,
      metadata: { ...dto.metadata, description: dto.description, order: dto.order },
    };
    return this.http
      .post<ApiResponse<{ item: any }>>(this.baseUrl, payload)
      .pipe(map((response) => this.mapToProductCategory(response.data?.item)));
  }

  /**
   * Update product category
   * PUT /config/product-categories/:id
   */
  updateProductCategory(id: string, dto: UpdateProductCategoryDto): Observable<ProductCategory> {
    const payload: Record<string, unknown> = {};
    if (dto.code !== undefined) payload['code'] = dto.code;
    if (dto.name !== undefined) payload['name'] = dto.name;
    if (dto.parentId !== undefined) payload['parentId'] = dto.parentId;
    if (dto.isActive !== undefined) payload['status'] = dto.isActive ? 'active' : 'inactive';
    if (dto.description !== undefined || dto.order !== undefined || dto.metadata !== undefined) {
      payload['metadata'] = { ...dto.metadata, description: dto.description, order: dto.order };
    }
    return this.http
      .patch<ApiResponse<{ item: any }>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((response) => this.mapToProductCategory(response.data?.item)));
  }

  /**
   * Delete product category (soft delete)
   * DELETE /config/product-categories/:id
   */
  deleteProductCategory(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Get category tree structure
   * GET /config/product-categories/tree
   */
  getTree(): Observable<ProductCategoryTreeNode[]> {
    const params = new HttpParams().set('catalog_type', 'category');
    return this.http
      .get<ApiResponse<any[]>>(`${this.baseUrl}/tree`, { params })
      .pipe(
        map((response) =>
          (response.data || []).map((i: any) => this.mapToProductCategory(i) as ProductCategoryTreeNode),
        ),
      );
  }

  /**
   * Get root categories (no parent)
   * GET /config/product-categories/roots
   */
  getRoots(): Observable<ProductCategory[]> {
    return this.http
      .get<ApiResponse<ProductCategory[]>>(`${this.baseUrl}/roots`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get children of a category
   * GET /config/product-categories/:id/children
   */
  getChildren(id: string): Observable<ProductCategory[]> {
    return this.http
      .get<ApiResponse<ProductCategory[]>>(`${this.baseUrl}/${id}/children`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get all descendants of a category
   * GET /config/product-categories/:id/descendants
   */
  getDescendants(id: string): Observable<ProductCategory[]> {
    return this.http
      .get<ApiResponse<ProductCategory[]>>(`${this.baseUrl}/${id}/descendants`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Export product categories as CSV (placeholder - to be implemented)
   * TODO: Implement backend endpoint
   */
  exportCSV(params: QueryProductCategoryParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.isActive !== undefined)
      httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Import product categories from CSV (placeholder - to be implemented)
   * TODO: Implement backend endpoint
   */
  importCSV(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<ImportResult>>(`${this.baseUrl}/import/csv`, formData)
      .pipe(map((response) => response.data || { success: 0, failed: 0, errors: [] }));
  }
}
