import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../constant';
import { ApiResponse, ApiPaginatedResponse, ApiSingleResponse } from '../../api/interfaces';

/**
 * Product Scope enum
 */
export enum ProductScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
}

/**
 * Product Status enum
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  DRAFT = 'draft',
}

/**
 * Product interface matching backend schema
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  internationalName?: string;
  description?: string;
  barcode?: string;
  scope: ProductScope;
  organizationId?: string;
  type: string; // Changed from ProductType enum to string since types are loaded from API
  status: ProductStatus;
  unit: string; // Changed from Unit enum to string
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    code?: string;
  };
  tags?: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Create Product DTO
 */
export interface CreateProductDto {
  sku: string;
  name: string;
  internationalName?: string;
  description?: string;
  barcode?: string;
  scope: ProductScope;
  organizationId?: string;
  type: string;
  status: ProductStatus;
  unit: string;
  categoryId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Update Product DTO
 */
export type UpdateProductDto = Partial<CreateProductDto>;

/**
 * Query parameters for product list
 */
export interface QueryProductParams {
  page?: number;
  limit?: number;
  scope?: ProductScope;
  type?: string;
  status?: ProductStatus;
  organizationId?: string;
  category?: string;
  tags?: string[];
  search?: string;
  sort?: string; // Format: field:order (e.g., name:asc)
  includeInactive?: boolean;
  includeDeleted?: boolean;
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
 * Product service - handles all product-related API calls
 * Backend controller: apps/inventory/src/controllers/product.controller.ts
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/v1/products`;

  /**
   * Get all products with filtering and pagination
   * GET /products
   */
  getProducts(
    params: QueryProductParams
  ): Observable<{ items: Product[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.scope) httpParams = httpParams.set('scope', params.scope);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.organizationId) httpParams = httpParams.set('organizationId', params.organizationId);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.tags && params.tags.length > 0) {
      httpParams = httpParams.set('tags', params.tags.join(','));
    }
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.includeInactive !== undefined) {
      httpParams = httpParams.set('includeInactive', params.includeInactive.toString());
    }
    if (params.includeDeleted !== undefined) {
      httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
    }

    return this.http
      .get<ApiPaginatedResponse<Product>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => {
          const data = response.data;
          if (!data) {
            return { items: [], total: 0, page: 1, limit: 10 };
          }
          return {
            items: data.items,
            total: data.total,
            page: data.page,
            limit: data.limit,
          };
        })
      );
  }

  /**
   * Get a single product by ID
   * GET /products/:id
   */
  getProductById(id: string, includeDeleted = false): Observable<Product> {
    let httpParams = new HttpParams();
    if (includeDeleted) {
      httpParams = httpParams.set('includeDeleted', 'true');
    }

    return this.http
      .get<ApiSingleResponse<Product>>(`${this.baseUrl}/${id}`, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Get a product by SKU
   * GET /products/sku/:sku
   */
  getProductBySku(sku: string, organizationId?: string): Observable<Product> {
    let httpParams = new HttpParams();
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .get<ApiSingleResponse<Product>>(`${this.baseUrl}/sku/${sku}`, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Create a new product
   * POST /products
   */
  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http
      .post<ApiSingleResponse<Product>>(this.baseUrl, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update a product
   * PATCH /products/:id
   */
  updateProduct(id: string, dto: UpdateProductDto): Observable<Product> {
    return this.http
      .patch<ApiSingleResponse<Product>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Soft delete a product
   * DELETE /products/:id
   */
  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  /**
   * Restore a soft-deleted product
   * POST /products/:id/restore
   */
  restoreProduct(id: string): Observable<Product> {
    return this.http
      .post<ApiSingleResponse<Product>>(`${this.baseUrl}/${id}/restore`, {})
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Bulk delete products
   * Iterates through product IDs and deletes them one by one
   */
  bulkDeleteProducts(ids: string[]): Observable<void> {
    // Since there's no bulk delete endpoint, we'll delete one by one
    // In a real implementation, you might want to use forkJoin for parallel deletion
    const deleteObservables = ids.map((id) => this.deleteProduct(id));
    return new Observable((observer) => {
      let completed = 0;
      deleteObservables.forEach((obs) => {
        obs.subscribe({
          next: () => {
            completed++;
            if (completed === ids.length) {
              observer.next();
              observer.complete();
            }
          },
          error: (err) => observer.error(err),
        });
      });
    });
  }

  /**
   * Export products to CSV
   * Returns a blob that can be downloaded
   */
  exportCSV(params: QueryProductParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.scope) httpParams = httpParams.set('scope', params.scope);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Import products from CSV file
   * POST /products/import/csv
   */
  importCSV(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiSingleResponse<ImportResult>>(`${this.baseUrl}/import/csv`, formData)
      .pipe(map((response) => response.data?.item!));
  }
}
