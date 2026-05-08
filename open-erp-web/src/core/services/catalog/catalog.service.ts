import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_PLATFORM } from '../../constant';
import { ApiResponse, ApiPaginatedResponse, ApiSingleResponse } from '../../api/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CatalogType = 'uom' | 'category' | 'product_type' | 'tag' | 'attribute';
export type CatalogItemStatus = 'active' | 'inactive';

export interface CatalogItem {
  id: string;
  tenant_id: string;
  catalog_type: CatalogType;
  code: string;
  name: string;
  org_id?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
  status: CatalogItemStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogItemDto {
  catalogType: CatalogType;
  code: string;
  name: string;
  orgId?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
  status?: CatalogItemStatus;
}

export interface UpdateCatalogItemDto {
  code?: string;
  name?: string;
  orgId?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
  status?: CatalogItemStatus;
}

export interface QueryCatalogItemParams {
  page?: number;
  limit?: number;
  catalog_type?: CatalogType;
  status?: CatalogItemStatus;
  q?: string;
}

export interface PublishCatalogItemsDto {
  ids: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * CatalogService — Angular service cho platform-service catalog items.
 * Base URL: API_URI_PLATFORM/v1/platform/catalog-items (port 3007)
 *
 * Hỗ trợ đầy đủ 7 endpoints:
 *  GET    /                  — danh sách
 *  POST   /                  — tạo mới
 *  GET    /tree              — cây theo catalog_type
 *  POST   /publish           — publish hàng loạt
 *  GET    /:id               — lấy một item
 *  PATCH  /:id               — cập nhật
 *  DELETE /:id               — xóa mềm
 */
@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_PLATFORM}/v1/platform/catalog-items`;

  /**
   * GET /v1/platform/catalog-items
   * Danh sách catalog items với filter và pagination.
   */
  getCatalogItems(
    params: QueryCatalogItemParams,
  ): Observable<{ items: CatalogItem[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.catalog_type) httpParams = httpParams.set('catalog_type', params.catalog_type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.q) httpParams = httpParams.set('q', params.q);

    return this.http
      .get<ApiPaginatedResponse<CatalogItem>>(this.baseUrl, { params: httpParams })
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
   * POST /v1/platform/catalog-items
   * Tạo mới một catalog item.
   */
  createCatalogItem(dto: CreateCatalogItemDto): Observable<CatalogItem> {
    return this.http
      .post<ApiSingleResponse<CatalogItem>>(this.baseUrl, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * GET /v1/platform/catalog-items/tree?catalog_type=:type
   * Lấy cây danh mục theo catalog_type.
   */
  getCatalogTree(catalogType: CatalogType): Observable<CatalogItem[]> {
    const params = new HttpParams().set('catalog_type', catalogType);
    return this.http
      .get<ApiResponse<CatalogItem[]>>(`${this.baseUrl}/tree`, { params })
      .pipe(map((response) => response.data || []));
  }

  /**
   * POST /v1/platform/catalog-items/publish
   * Publish hàng loạt catalog items theo danh sách id.
   */
  publishCatalogItems(dto: PublishCatalogItemsDto): Observable<{ published: number }> {
    return this.http
      .post<ApiResponse<{ published: number }>>(`${this.baseUrl}/publish`, dto)
      .pipe(map((response) => response.data!));
  }

  /**
   * GET /v1/platform/catalog-items/:id
   * Lấy chi tiết một catalog item theo id.
   */
  getCatalogItemById(id: string): Observable<CatalogItem | null> {
    return this.http
      .get<ApiSingleResponse<CatalogItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data?.item || null));
  }

  /**
   * PATCH /v1/platform/catalog-items/:id
   * Cập nhật catalog item (partial update).
   */
  updateCatalogItem(id: string, dto: UpdateCatalogItemDto): Observable<CatalogItem> {
    return this.http
      .patch<ApiSingleResponse<CatalogItem>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * DELETE /v1/platform/catalog-items/:id
   * Xóa mềm một catalog item.
   */
  deleteCatalogItem(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
