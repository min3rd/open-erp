import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, firstValueFrom } from 'rxjs';
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
 * Product Type interface matching backend schema
 */
export interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  attributes?: AttributeDefinition[];
  metadata?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO for creating a new product type
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
  sort?: Map<string, 1 | -1>;
}

/**
 * Product Type service - handles all product type related API calls
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
  getProductTypes(
    params: QueryProductTypeParams,
  ): Observable<{ items: ProductType[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.isActive !== undefined)
      httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) {
      httpParams = httpParams.set('sort', JSON.stringify(Object.fromEntries(params.sort)));
    }

    return this.http
      .get<ApiPaginatedResponse<ProductType>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  /**
   * Get active product types for dropdowns
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
    return this.http.post<ApiResponse<{ item: ProductType }>>(this.baseUrl, dto).pipe(
      map((response) => {
        if (!response.data?.item) {
          throw new Error('No data returned from API');
        }
        return response.data.item;
      }),
    );
  }

  /**
   * Update product type
   * PUT /config/product-types/:id
   */
  updateProductType(id: string, dto: UpdateProductTypeDto): Observable<ProductType> {
    return this.http.put<ApiResponse<{ item: ProductType }>>(`${this.baseUrl}/${id}`, dto).pipe(
      map((response) => {
        if (!response.data?.item) {
          throw new Error('No data returned from API');
        }
        return response.data.item;
      }),
    );
  }

  /**
   * Delete product type (soft delete)
   * DELETE /config/product-types/:id
   */
  deleteProductType(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Export product types as CSV (client-side generation)
   */
  exportCSV(productTypes: ProductType[]): void {
    const headers = ['Code', 'Name', 'Description', 'Active', 'Created At', 'Updated At'];
    const rows = productTypes.map((pt) => [
      pt.code,
      pt.name,
      pt.description || '',
      pt.isActive ? 'Yes' : 'No',
      pt.createdAt || '',
      pt.updatedAt || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-types-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Import product types from CSV
   * Returns array of results with success/error for each row
   */
  importCSV(file: File): Observable<{ success: boolean; row: number; error?: string }[]> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        const results: { success: boolean; row: number; error?: string }[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map((cell) => cell.replace(/^"|"$/g, '').trim());
          if (cells.length >= 2) {
            const dto: CreateProductTypeDto = {
              code: cells[0],
              name: cells[1],
              description: cells[2] || undefined,
              isActive: cells[3]?.toLowerCase() !== 'no',
            };

            try {
              await firstValueFrom(this.createProductType(dto));
              results.push({ success: true, row: i + 1 });
            } catch (error: any) {
              results.push({
                success: false,
                row: i + 1,
                error: error?.error?.message || 'Failed to import',
              });
            }
          } else {
            results.push({ success: false, row: i + 1, error: 'Invalid row format' });
          }
        }

        observer.next(results);
        observer.complete();
      };
      reader.onerror = () => {
        observer.error(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }
}
