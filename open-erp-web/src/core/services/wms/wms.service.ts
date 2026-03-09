import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../constant';
import { ApiResponse, ApiPaginatedResponse, ApiSingleResponse } from '../../api/interfaces';
import {
  Receipt,
  CreateReceiptDto,
  UpdateReceiptDto,
  SubmitReceiptDto,
  ReviewReceiptDto,
  ApproveReceiptDto,
  ReceiveReceiptDto,
  FinalizeReceiptDto,
  UnlockReceiptDto,
  QcReceiptDto,
  ReceiptStatus,
  QcStatus,
  Picklist,
  CreatePicklistDto,
  PickDto,
  PicklistStatus,
  WmsPackage,
  CreatePackageDto,
  WmsPackageStatus,
  Shipment,
  CreateShipmentDto,
  ShipShipmentDto,
  ShipmentStatus,
  AuditEntry,
} from './wms.types';

export type {
  Receipt,
  CreateReceiptDto,
  UpdateReceiptDto,
  SubmitReceiptDto,
  ReviewReceiptDto,
  ApproveReceiptDto,
  ReceiveReceiptDto,
  FinalizeReceiptDto,
  UnlockReceiptDto,
  QcReceiptDto,
  ReceiptLine,
  ReferenceDoc,
  AuditEntry,
  Picklist,
  PicklistLine,
  CreatePicklistDto,
  PickDto,
  WmsPackage,
  CreatePackageDto,
  Shipment,
  CreateShipmentDto,
  ShipShipmentDto,
} from './wms.types';

export {
  ReceiptStatus,
  ReceiptType,
  QcStatus,
  PicklistStatus,
  WmsPackageStatus,
  ShipmentStatus,
} from './wms.types';

@Injectable({
  providedIn: 'root',
})
export class WmsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/v1`;

  // ===== Receipts API =====

  getReceipts(params?: {
    orgId?: string;
    warehouseId?: string;
    poId?: string;
    status?: ReceiptStatus;
    q?: string;
    sortField?: string;
    sortOrder?: number;
    page?: number;
    limit?: number;
  }): Observable<{ items: Receipt[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.orgId) httpParams = httpParams.set('orgId', params.orgId);
    if (params?.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params?.poId) httpParams = httpParams.set('poId', params.poId);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params?.sortOrder !== undefined) httpParams = httpParams.set('sortOrder', params.sortOrder.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<Receipt>>(`${this.baseUrl}/wms/receipts`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getReceiptById(id: string): Observable<Receipt> {
    return this.http
      .get<ApiSingleResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}`)
      .pipe(map((response) => response.data?.item!));
  }

  createReceipt(dto: CreateReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiSingleResponse<Receipt>>(`${this.baseUrl}/wms/receipts`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  updateReceipt(id: string, dto: UpdateReceiptDto): Observable<Receipt> {
    return this.http
      .patch<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}`, dto)
      .pipe(map((response) => response.data!));
  }

  submitReceipt(id: string, dto: SubmitReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/submit`, dto)
      .pipe(map((response) => response.data!));
  }

  reviewReceipt(id: string, dto: ReviewReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/review`, dto)
      .pipe(map((response) => response.data!));
  }

  approveReceipt(id: string, dto: ApproveReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/approve`, dto)
      .pipe(map((response) => response.data!));
  }

  receiveReceipt(id: string, dto: ReceiveReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/receive`, dto)
      .pipe(map((response) => response.data!));
  }

  finalizeReceipt(id: string, dto: FinalizeReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/finalize`, dto)
      .pipe(map((response) => response.data!));
  }

  unlockReceipt(id: string, dto: UnlockReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/unlock`, dto)
      .pipe(map((response) => response.data!));
  }

  applyQc(id: string, dto: QcReceiptDto): Observable<Receipt> {
    return this.http
      .post<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/qc`, dto)
      .pipe(map((response) => response.data!));
  }

  completeReceipt(id: string): Observable<Receipt> {
    return this.http
      .patch<ApiResponse<Receipt>>(`${this.baseUrl}/wms/receipts/${id}/complete`, {})
      .pipe(map((response) => response.data!));
  }

  getReceiptAudit(id: string): Observable<AuditEntry[]> {
    return this.http
      .get<ApiResponse<AuditEntry[]>>(`${this.baseUrl}/wms/receipts/${id}/audit`)
      .pipe(map((response) => response.data || []));
  }

  getReceiptLabel(id: string): Observable<{ id: string; code: string; url: string; qrData: string }> {
    return this.http
      .get<ApiResponse<{ id: string; code: string; url: string; qrData: string }>>(`${this.baseUrl}/wms/receipts/${id}/label`)
      .pipe(map((response) => response.data!));
  }

  // ===== Picklists API =====

  getPicklists(params?: {
    orgId?: string;
    warehouseId?: string;
    status?: PicklistStatus;
    q?: string;
    sortField?: string;
    sortOrder?: number;
    page?: number;
    limit?: number;
  }): Observable<{ items: Picklist[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.orgId) httpParams = httpParams.set('orgId', params.orgId);
    if (params?.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params?.sortOrder !== undefined) httpParams = httpParams.set('sortOrder', params.sortOrder.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<Picklist>>(`${this.baseUrl}/wms/picklists`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getPicklistById(id: string): Observable<Picklist> {
    return this.http
      .get<ApiResponse<Picklist>>(`${this.baseUrl}/wms/picklists/${id}`)
      .pipe(map((response) => response.data!));
  }

  createPicklist(dto: CreatePicklistDto): Observable<Picklist> {
    return this.http
      .post<ApiResponse<{ mode: string; item: Picklist }>>(`${this.baseUrl}/wms/picklists`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  pick(id: string, dto: PickDto): Observable<Picklist> {
    return this.http
      .patch<ApiResponse<Picklist>>(`${this.baseUrl}/wms/picklists/${id}/pick`, dto)
      .pipe(map((response) => response.data!));
  }

  // ===== Packages API =====

  getPackages(params?: {
    orgId?: string;
    shipmentId?: string;
    status?: WmsPackageStatus;
    page?: number;
    limit?: number;
  }): Observable<{ items: WmsPackage[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.orgId) httpParams = httpParams.set('orgId', params.orgId);
    if (params?.shipmentId) httpParams = httpParams.set('shipmentId', params.shipmentId);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<WmsPackage>>(`${this.baseUrl}/wms/packages`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getPackageById(id: string): Observable<WmsPackage> {
    return this.http
      .get<ApiResponse<WmsPackage>>(`${this.baseUrl}/wms/packages/${id}`)
      .pipe(map((response) => response.data!));
  }

  createPackage(dto: CreatePackageDto): Observable<WmsPackage> {
    return this.http
      .post<ApiResponse<{ mode: string; item: WmsPackage }>>(`${this.baseUrl}/wms/packages`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  // ===== Shipments API =====

  getShipments(params?: {
    orgId?: string;
    warehouseId?: string;
    status?: ShipmentStatus;
    q?: string;
    sortField?: string;
    sortOrder?: number;
    page?: number;
    limit?: number;
  }): Observable<{ items: Shipment[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params?.orgId) httpParams = httpParams.set('orgId', params.orgId);
    if (params?.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params?.sortOrder !== undefined) httpParams = httpParams.set('sortOrder', params.sortOrder.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiPaginatedResponse<Shipment>>(`${this.baseUrl}/wms/shipments`, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.http
      .get<ApiResponse<Shipment>>(`${this.baseUrl}/wms/shipments/${id}`)
      .pipe(map((response) => response.data!));
  }

  createShipment(dto: CreateShipmentDto): Observable<Shipment> {
    return this.http
      .post<ApiResponse<{ mode: string; item: Shipment }>>(`${this.baseUrl}/wms/shipments`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  shipShipment(id: string, dto: ShipShipmentDto): Observable<Shipment> {
    return this.http
      .patch<ApiResponse<Shipment>>(`${this.baseUrl}/wms/shipments/${id}/ship`, dto)
      .pipe(map((response) => response.data!));
  }

  markDelivered(id: string): Observable<Shipment> {
    return this.http
      .patch<ApiResponse<Shipment>>(`${this.baseUrl}/wms/shipments/${id}/deliver`, {})
      .pipe(map((response) => response.data!));
  }
}
