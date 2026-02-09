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
  slug?: string;
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
  thumbnail?: ThumbnailDto;
  media?: MediaItemDto[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
    weight?: number;
    weightUnit: string;
  };
  storageConditions?: {
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMin?: number;
    humidityMax?: number;
    requirements?: string[];
    specialInstructions?: string;
  };
  hasExpiryDate?: boolean;
  shelfLifeDays?: number;
  trackingType?: string;
  hazardLevel?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  customAttributes?: CustomAttributeDto[];
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Custom attribute DTO
 */
export interface CustomAttributeDto {
  name: string;
  value: string;
  unit?: string;
}

/**
 * Thumbnail DTO
 */
export interface ThumbnailDto {
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
  minioObjectKey?: string;
  minioBucket?: string;
}

/**
 * Media item DTO
 */
export interface MediaItemDto {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  order?: number;
  isPrimary?: boolean;
  minioObjectKey?: string;
  minioBucket?: string;
}

/**
 * Register Media DTO - matches backend RegisterMediaDto
 */
export interface RegisterMediaDto {
  objectKey: string;
  type: 'thumbnail' | 'image' | 'video' | 'document';
  url: string;
  filename: string;
  contentType: string;
  size: number;
  title?: string;
}

/**
 * Category snapshot DTO
 */
export interface CategorySnapshotDto {
  id?: string;
  name: string;
  code?: string;
  description?: string;
}

/**
 * Create Product DTO
 */
export interface CreateProductDto {
  sku: string;
  name: string;
  slug?: string;
  internationalName?: string;
  description?: string;
  barcode?: string;
  thumbnail?: ThumbnailDto;
  media?: MediaItemDto[];
  scope: ProductScope;
  organizationId?: string;
  type: string;
  category?: CategorySnapshotDto;
  status: ProductStatus;
  unit: string;
  tags?: string[];
}

/**
 * Dimensions DTO
 */
export interface DimensionsDto {
  length?: number;
  width?: number;
  height?: number;
  unit: string;
  weight?: number;
  weightUnit: string;
}

/**
 * Storage Conditions DTO
 */
export interface StorageConditionsDto {
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  requirements?: string[];
  specialInstructions?: string;
}

/**
 * Update Product DTO
 */
export interface UpdateProductDto {
  name?: string;
  slug?: string;
  internationalName?: string;
  description?: string;
  barcode?: string;
  thumbnail?: ThumbnailDto | null;
  media?: MediaItemDto[];
  type?: string;
  category?: CategorySnapshotDto;
  status?: ProductStatus;
  unit?: string;
  dimensions?: DimensionsDto;
  storageConditions?: StorageConditionsDto;
  hasExpiryDate?: boolean;
  shelfLifeDays?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  tags?: string[];
}

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
   * Get a product by identifier (slug, SKU, or ID)
   * GET /products/:identifier
   * Resolution order: slug → sku → id
   */
  getProductByIdentifier(identifier: string, includeDeleted = false, organizationId?: string): Observable<Product> {
    let httpParams = new HttpParams();
    if (includeDeleted) {
      httpParams = httpParams.set('includeDeleted', 'true');
    }
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .get<ApiSingleResponse<Product>>(`${this.baseUrl}/${identifier}`, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Get a single product by ID
   * GET /products/:id
   * @deprecated Use getProductByIdentifier instead for slug support
   */
  getProductById(id: string, includeDeleted = false): Observable<Product> {
    return this.getProductByIdentifier(id, includeDeleted);
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
   * Get presigned URL for uploading media before product creation
   * GET /products/media/presign-upload
   */
  getPresignedUploadUrl(
    filename: string,
    contentType: string,
    type: 'thumbnail' | 'media' = 'thumbnail',
    organizationId?: string
  ): Observable<{ uploadUrl: string; objectKey: string; bucket: string; method: string; expiresAt: string }> {
    let httpParams = new HttpParams()
      .set('filename', filename)
      .set('contentType', contentType)
      .set('type', type);
    
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .get<any>(`${this.baseUrl}/media/presign-upload`, { params: httpParams })
      .pipe(
        map((response) => {
          const item = response.data?.item;
          return {
            uploadUrl: item.uploadUrl,
            objectKey: item.objectKey,
            bucket: item.bucket,
            method: item.method,
            expiresAt: item.expiresAt
          };
        })
      );
  }

  /**
   * Upload file to presigned URL (bypasses interceptors)
   * Using native fetch to avoid Authorization header and other interceptor modifications
   */
  uploadFileToPresignedUrl(url: string, file: File): Observable<void> {
    return new Observable(observer => {
      fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
        .then(response => {
          if (response.ok) {
            observer.next();
            observer.complete();
          } else {
            observer.error(new Error(`Upload failed with status ${response.status}`));
          }
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Update a product by identifier (slug, SKU, or ID)
   * PATCH /products/:identifier
   * Resolution order: slug → sku → id
   */
  updateProductByIdentifier(identifier: string, dto: UpdateProductDto, organizationId?: string): Observable<Product> {
    let httpParams = new HttpParams();
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .patch<ApiSingleResponse<Product>>(`${this.baseUrl}/${identifier}`, dto, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update a product
   * PATCH /products/:id
   * @deprecated Use updateProductByIdentifier instead for slug support
   */
  updateProduct(id: string, dto: UpdateProductDto): Observable<Product> {
    return this.updateProductByIdentifier(id, dto);
  }

  /**
   * Soft delete a product by identifier (slug, SKU, or ID)
   * DELETE /products/:identifier
   * Resolution order: slug → sku → id
   */
  deleteProductByIdentifier(identifier: string, organizationId?: string): Observable<void> {
    let httpParams = new HttpParams();
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${identifier}`, { params: httpParams })
      .pipe(map(() => undefined));
  }

  /**
   * Soft delete a product
   * DELETE /products/:id
   * @deprecated Use deleteProductByIdentifier instead for slug support
   */
  deleteProduct(id: string): Observable<void> {
    return this.deleteProductByIdentifier(id);
  }

  /**
   * Publish a product (set status to active) by identifier (slug, SKU, or ID)
   * POST /products/:identifier/publish
   * Resolution order: slug → sku → id
   */
  publishProduct(identifier: string, organizationId?: string): Observable<Product> {
    let httpParams = new HttpParams();
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .post<ApiSingleResponse<Product>>(`${this.baseUrl}/${identifier}/publish`, {}, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Mark a product as inactive by identifier (slug, SKU, or ID)
   * POST /products/:identifier/inactive
   * Resolution order: slug → sku → id
   */
  markProductInactive(identifier: string, organizationId?: string): Observable<Product> {
    let httpParams = new HttpParams();
    if (organizationId) {
      httpParams = httpParams.set('organizationId', organizationId);
    }

    return this.http
      .post<ApiSingleResponse<Product>>(`${this.baseUrl}/${identifier}/inactive`, {}, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
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

  /**
   * Register uploaded media with product
   * POST /products/:id/media/register
   */
  registerProductMedia(productId: string, media: RegisterMediaDto): Observable<Product> {
    return this.http
      .post<ApiSingleResponse<Product>>(`${this.baseUrl}/${productId}/media/register`, media)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete product media
   * DELETE /products/:id/media?objectKey=...
   */
  deleteProductMedia(productId: string, objectKey: string): Observable<Product> {
    const httpParams = new HttpParams().set('objectKey', objectKey);
    return this.http
      .delete<ApiSingleResponse<Product>>(`${this.baseUrl}/${productId}/media`, { params: httpParams })
      .pipe(map((response) => response.data?.item!));
  }
}
