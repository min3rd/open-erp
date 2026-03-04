import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../constant';
import { ApiResponse, ApiPaginatedResponse } from '../../api/interfaces';
import {
  InventoryStock,
  StockSummary,
  Lot,
  CreateLotDto,
  UpdateLotDto,
  Serial,
  SerialStatus,
  CreateSerialDto,
  UpdateSerialDto,
  InventoryTransaction,
} from './stock.types';

export type {
  StockProductSnapshot,
  StockLotInfo,
  InventoryStock,
  StockSummary,
  Lot,
  CreateLotDto,
  UpdateLotDto,
  SerialStatus,
  Serial,
  CreateSerialDto,
  UpdateSerialDto,
  InventoryTransaction,
} from './stock.types';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/v1/inventory`;

  // ===== Stock API =====

  getWarehouseStock(
    warehouseId: string,
    params?: { page?: number; limit?: number },
  ): Observable<{ items: InventoryStock[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<InventoryStock>>(
        `${this.baseUrl}/stock/warehouse/${warehouseId}`,
        { params: httpParams },
      )
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getWarehouseStockSummary(warehouseId: string): Observable<StockSummary | null> {
    return this.http
      .get<ApiResponse<StockSummary>>(`${this.baseUrl}/warehouses/${warehouseId}/stock/summary`)
      .pipe(map((response) => response.data || null));
  }

  getStockBySku(
    skuId: string,
    params?: { warehouseId?: string; page?: number; limit?: number },
  ): Observable<{ items: InventoryStock[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<InventoryStock>>(`${this.baseUrl}/skus/${skuId}/stock`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getLocationStock(
    binId: string,
    params?: { page?: number; limit?: number },
  ): Observable<{ items: InventoryStock[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<InventoryStock>>(`${this.baseUrl}/locations/${binId}/stock`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getTransactionHistory(params?: {
    productId?: string;
    warehouseId?: string;
    organizationId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: InventoryTransaction[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.productId) httpParams = httpParams.set('productId', params.productId);
    if (params?.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params?.organizationId)
      httpParams = httpParams.set('organizationId', params.organizationId);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<InventoryTransaction>>(`${this.baseUrl}/transactions`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  // ===== Lot API =====

  getLots(params?: {
    skuId?: string;
    expired?: boolean;
    page?: number;
    limit?: number;
  }): Observable<{ items: Lot[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.skuId) httpParams = httpParams.set('skuId', params.skuId);
    if (params?.expired !== undefined)
      httpParams = httpParams.set('expired', params.expired.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<Lot>>(`${this.baseUrl}/lots`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  createLot(dto: CreateLotDto): Observable<Lot> {
    return this.http
      .post<ApiResponse<{ mode: string; item: Lot }>>(`${this.baseUrl}/lots`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  updateLot(id: string, dto: UpdateLotDto): Observable<Lot> {
    return this.http
      .patch<ApiResponse<Lot>>(`${this.baseUrl}/lots/${id}`, dto)
      .pipe(map((response) => response.data!));
  }

  // ===== Serial API =====

  getSerials(params?: {
    skuId?: string;
    status?: SerialStatus;
    binId?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: Serial[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.skuId) httpParams = httpParams.set('skuId', params.skuId);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.binId) httpParams = httpParams.set('binId', params.binId);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<Serial>>(`${this.baseUrl}/serials`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  createSerial(dto: CreateSerialDto): Observable<Serial> {
    return this.http
      .post<ApiResponse<{ mode: string; item: Serial }>>(`${this.baseUrl}/serials`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  updateSerial(id: string, dto: UpdateSerialDto): Observable<Serial> {
    return this.http
      .patch<ApiResponse<Serial>>(`${this.baseUrl}/serials/${id}`, dto)
      .pipe(map((response) => response.data!));
  }
}
