import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../constant';
import { ApiResponse, ApiPaginatedResponse } from '../../api/interfaces';

/**
 * Attribute definition for product type
 */
export interface AttributeDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  label?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  validation?: Record<string, any>;
}

/**
 * Product Type interface
 */
export interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  attributes: AttributeDefinition[];
  metadata?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * DTO for creating a product type
 */
export interface CreateProductTypeDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  attributes?: AttributeDefinition[];
  metadata?: Record<string, any>;
}

/**
 * DTO for updating a product type
 */
export type UpdateProductTypeDto = Partial<CreateProductTypeDto>;

/**
 * Query parameters for listing product types
 */
export interface QueryProductTypeParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Product Type service - handles all product type API calls
 * Backend controller: apps/inventory/src/controllers/product-type.controller.ts
 */
@Injectable({
  providedIn: 'root',
})
export class ProductTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/v1/config/product-types`;

  /**
   * Get all product types with filtering and pagination
   * GET /config/product-types
   */
  getProductTypes(params: QueryProductTypeParams): Observable<{ items: ProductType[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiPaginatedResponse<ProductType>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 10,
        }))
      );
  }

  /**
   * Get active product types (for dropdowns)
   * GET /config/product-types/active
   */
  getActiveProductTypes(): Observable<ProductType[]> {
    return this.http
      .get<ApiResponse<ProductType[]>>(`${this.baseUrl}/active`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get product type by ID
   * GET /config/product-types/:id
   */
  getProductTypeById(id: string): Observable<ProductType | null> {
    return this.http
      .get<ApiResponse<{ item: ProductType }>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data?.item || null));
  }

  /**
   * Create new product type
   * POST /config/product-types
   */
  createProductType(dto: CreateProductTypeDto): Observable<ProductType> {
    return this.http
      .post<ApiResponse<{ item: ProductType }>>(this.baseUrl, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update product type
   * PUT /config/product-types/:id
   */
  updateProductType(id: string, dto: UpdateProductTypeDto): Observable<ProductType> {
    return this.http
      .put<ApiResponse<{ item: ProductType }>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete product type (soft delete)
   * DELETE /config/product-types/:id
   */
  deleteProductType(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  /**
   * Export product types as CSV
   * Note: Backend may need to implement this endpoint
   */
  exportCSV(params: QueryProductTypeParams): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Import product types from CSV
   * Note: Backend may need to implement this endpoint
   */
  importCSV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/import/csv`, formData)
      .pipe(map((response) => response.data));
  }
}
