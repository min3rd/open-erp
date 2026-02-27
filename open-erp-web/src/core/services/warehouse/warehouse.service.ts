import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../constant';
import { ApiResponse, ApiPaginatedResponse } from '../../api/interfaces';

/**
 * Warehouse types - should be imported from module
 */
export interface ProvinceDto {
  code: string;
  name: string;
}

export interface WardDto {
  code: string;
  name: string;
}

export interface LocationDto {
  type: 'Point';
  coordinates: [number, number];
}

export interface ManagerDto {
  id?: string;
  name: string;
}

export interface CameraSystemDto {
  cameraCount?: number;
  coverage?: string;
  recordingDays?: number;
  isAIEnabled?: boolean;
}

export interface AccessControlDto {
  system?: string;
  biometric?: boolean;
  cardAccess?: boolean;
  securityGuards?: number;
}

export interface Warehouse {
  id: string;
  warehouseId?: string;
  code: string;
  name: string;
  type: string;
  status: string;
  organizationId?: string;
  businessLicense?: string;
  warehouseLicense?: string;
  customsCode?: string;
  addressDetail: string;
  ward: WardDto;
  province: ProvinceDto;
  region?: string;
  location?: LocationDto;
  totalAreaM2?: number;
  usableAreaM2?: number;
  storageCapacity?: number;
  capacityUnit?: string;
  zonesCount?: number;
  racksCount?: number;
  floorsCount?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  specialConditions?: string[];
  manager?: ManagerDto;
  contactPhone?: string;
  contactEmail?: string;
  workersCount?: number;
  workingShift?: string;
  operatingHours?: string;
  fireProtectionCert?: string;
  securityLevel?: string;
  cameraSystem?: CameraSystemDto;
  accessControl?: AccessControlDto;
  insurancePolicy?: string;
  storageFee?: number;
  handlingFee?: number;
  currency?: string;
  paymentTerm?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  tenantId?: string;
  organizationName?: string;
  fullAddress?: string;
}

export interface CreateWarehouseDto {
  warehouseId?: string;
  code: string;
  name: string;
  type: string;
  status?: string;
  organizationId?: string;
  businessLicense?: string;
  warehouseLicense?: string;
  customsCode?: string;
  addressDetail: string;
  ward: WardDto;
  province: ProvinceDto;
  region?: string;
  location?: LocationDto;
  totalAreaM2?: number;
  usableAreaM2?: number;
  storageCapacity?: number;
  capacityUnit?: string;
  zonesCount?: number;
  racksCount?: number;
  floorsCount?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  specialConditions?: string[];
  manager?: ManagerDto;
  contactPhone?: string;
  contactEmail?: string;
  workersCount?: number;
  workingShift?: string;
  operatingHours?: string;
  fireProtectionCert?: string;
  securityLevel?: string;
  cameraSystem?: CameraSystemDto;
  accessControl?: AccessControlDto;
  insurancePolicy?: string;
  storageFee?: number;
  handlingFee?: number;
  currency?: string;
  paymentTerm?: string;
  tenantId?: string;
}

export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

export interface QueryWarehouseParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  provinceCode?: string;
  wardCode?: string;
  region?: string;
  tenantId?: string;
  search?: string;
  bbox?: string;
}

// ===== Zone =====
export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type: string;
  sequence: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateZoneDto {
  code: string;
  name: string;
  type?: string;
  sequence?: number;
  isDefault?: boolean;
  isActive?: boolean;
  description?: string;
}

export type UpdateZoneDto = Partial<CreateZoneDto>;

// ===== Aisle =====
export interface Aisle {
  id: string;
  zoneId: string;
  code: string;
  name: string;
  sequence: number;
  levels: number;
  isActive: boolean;
  description?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAisleDto {
  code: string;
  name: string;
  sequence?: number;
  levels?: number;
  isActive?: boolean;
  description?: string;
}

export type UpdateAisleDto = Partial<CreateAisleDto>;

// ===== Bin =====
export interface BinDimensions {
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface Bin {
  id: string;
  aisleId: string;
  code: string;
  barcode?: string;
  capacityQty: number;
  capacityVolume?: number;
  currentQty: number;
  allowedSkuTags?: string[];
  dimensions?: BinDimensions;
  binType: string;
  isBlocked: boolean;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBinDto {
  code: string;
  barcode?: string;
  capacityQty?: number;
  capacityVolume?: number;
  allowedSkuTags?: string[];
  dimensions?: BinDimensions;
  binType?: string;
  isBlocked?: boolean;
  isActive?: boolean;
}

export type UpdateBinDto = Partial<CreateBinDto>;

// ===== Structure Tree =====
export interface AisleWithBins extends Aisle {
  bins: Bin[];
}

export interface ZoneWithAisles extends Zone {
  aisles: AisleWithBins[];
}

export interface WarehouseStructure extends Warehouse {
  zones: ZoneWithAisles[];
}

// ===== Layout =====

export type LayoutObjectType = 'zone' | 'aisle' | 'bin';

export interface WarehouseLayout {
  id: string;
  warehouseId: string;
  widthM: number;
  lengthM: number;
  units: string;
  scale: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LayoutObject {
  id: string;
  warehouseId: string;
  parentId?: string | null;
  type: LayoutObjectType;
  code: string;
  name: string;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  rotationDeg: number;
  barcode?: string;
  isBlocked: boolean;
  capacityQty: number;
  capacityVolume?: number;
  allowedSkuTags?: string[];
  metadata?: Record<string, any>;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // UI-only fields (not persisted)
  selected?: boolean;
}

export interface CreateLayoutDto {
  widthM: number;
  lengthM: number;
  scale?: number;
}

export interface CreateLayoutObjectDto {
  parentId?: string | null;
  type: LayoutObjectType;
  code: string;
  name: string;
  x?: number;
  y?: number;
  widthM: number;
  heightM: number;
  rotationDeg?: number;
  barcode?: string;
  isBlocked?: boolean;
  capacityQty?: number;
  capacityVolume?: number;
  allowedSkuTags?: string[];
}

/**
 * Warehouse service - handles all warehouse-related API calls
 * Backend controller: apps/inventory/src/controllers/warehouse.controller.ts
 *
 * Moved to core since warehouse data is used across multiple modules
 */
@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/v1/warehouses`;
  private readonly inventoryUrl = `${API_URI_INVENTORY}/v1`;

  /**
   * Get all warehouses with filtering and pagination
   * GET /warehouses
   */
  getWarehouses(
    params: QueryWarehouseParams,
  ): Observable<{ items: Warehouse[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.provinceCode) httpParams = httpParams.set('provinceCode', params.provinceCode);
    if (params.wardCode) httpParams = httpParams.set('wardCode', params.wardCode);
    if (params.region) httpParams = httpParams.set('region', params.region);
    if (params.tenantId) httpParams = httpParams.set('tenantId', params.tenantId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.bbox) httpParams = httpParams.set('bbox', params.bbox);

    return this.http
      .get<ApiPaginatedResponse<Warehouse>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 10,
        })),
      );
  }

  /**
   * Get warehouse by ID
   * GET /warehouses/:id
   */
  getWarehouseById(id: string): Observable<Warehouse | null> {
    return this.http
      .get<ApiResponse<{ item: Warehouse }>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data?.item || null));
  }

  /**
   * Get full warehouse structure tree
   * GET /warehouses/:id/structure
   */
  getWarehouseStructure(id: string): Observable<WarehouseStructure | null> {
    return this.http
      .get<ApiResponse<WarehouseStructure>>(`${this.baseUrl}/${id}/structure`)
      .pipe(map((response) => response.data || null));
  }

  /**
   * Create new warehouse
   * POST /warehouses
   */
  createWarehouse(dto: CreateWarehouseDto): Observable<Warehouse> {
    return this.http
      .post<ApiResponse<{ item: Warehouse }>>(this.baseUrl, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update warehouse
   * PATCH /warehouses/:id
   */
  updateWarehouse(id: string, dto: UpdateWarehouseDto): Observable<Warehouse> {
    return this.http
      .patch<ApiResponse<{ item: Warehouse }>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete warehouse (soft delete)
   * DELETE /warehouses/:id
   */
  deleteWarehouse(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Bulk delete warehouses
   */
  bulkDeleteWarehouses(ids: string[]): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/bulk-delete`, { ids })
      .pipe(map(() => undefined));
  }

  /**
   * Get list of provinces for dropdown
   * GET /warehouses/provinces
   */
  getProvinces(): Observable<ProvinceDto[]> {
    return this.http
      .get<ApiResponse<ProvinceDto[]>>(`${this.baseUrl}/provinces`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get list of wards by province code for dropdown
   * GET /warehouses/provinces/:provinceCode/wards
   */
  getWardsByProvince(provinceCode: string): Observable<WardDto[]> {
    return this.http
      .get<ApiResponse<WardDto[]>>(`${this.baseUrl}/provinces/${provinceCode}/wards`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Find warehouses nearby a location
   * GET /warehouses/nearby
   */
  findNearby(
    longitude: number,
    latitude: number,
    radiusKm: number,
    limit?: number,
  ): Observable<Warehouse[]> {
    let httpParams = new HttpParams()
      .set('longitude', longitude.toString())
      .set('latitude', latitude.toString())
      .set('radiusKm', radiusKm.toString());

    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }

    return this.http
      .get<ApiResponse<Warehouse[]>>(`${this.baseUrl}/nearby`, { params: httpParams })
      .pipe(map((response) => response.data || []));
  }

  /**
   * Export warehouses as CSV
   */
  exportCSV(params: QueryWarehouseParams): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Export warehouses as GeoJSON
   */
  exportGeoJSON(params: QueryWarehouseParams): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/geojson`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  // ===== Zone API =====

  /**
   * Get zones for a warehouse
   * GET /warehouses/:warehouseId/zones
   */
  getZones(warehouseId: string, params?: { page?: number; limit?: number; search?: string }): Observable<{ items: Zone[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiPaginatedResponse<Zone>>(`${this.baseUrl}/${warehouseId}/zones`, { params: httpParams })
      .pipe(map((response) => ({
        items: response.data?.items || [],
        total: response.data?.total || 0,
      })));
  }

  /**
   * Create a zone in a warehouse
   * POST /warehouses/:warehouseId/zones
   */
  createZone(warehouseId: string, dto: CreateZoneDto): Observable<Zone> {
    return this.http
      .post<ApiResponse<{ item: Zone }>>(`${this.baseUrl}/${warehouseId}/zones`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update a zone
   * PUT /zones/:id
   */
  updateZone(id: string, dto: UpdateZoneDto): Observable<Zone> {
    return this.http
      .put<ApiResponse<{ item: Zone }>>(`${this.inventoryUrl}/zones/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete a zone
   * DELETE /zones/:id
   */
  deleteZone(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.inventoryUrl}/zones/${id}`)
      .pipe(map(() => undefined));
  }

  // ===== Aisle API =====

  /**
   * Get aisles for a zone
   * GET /zones/:zoneId/aisles
   */
  getAisles(zoneId: string, params?: { page?: number; limit?: number; search?: string }): Observable<{ items: Aisle[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiPaginatedResponse<Aisle>>(`${this.inventoryUrl}/zones/${zoneId}/aisles`, { params: httpParams })
      .pipe(map((response) => ({
        items: response.data?.items || [],
        total: response.data?.total || 0,
      })));
  }

  /**
   * Create an aisle in a zone
   * POST /zones/:zoneId/aisles
   */
  createAisle(zoneId: string, dto: CreateAisleDto): Observable<Aisle> {
    return this.http
      .post<ApiResponse<{ item: Aisle }>>(`${this.inventoryUrl}/zones/${zoneId}/aisles`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update an aisle
   * PUT /aisles/:id
   */
  updateAisle(id: string, dto: UpdateAisleDto): Observable<Aisle> {
    return this.http
      .put<ApiResponse<{ item: Aisle }>>(`${this.inventoryUrl}/aisles/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete an aisle
   * DELETE /aisles/:id
   */
  deleteAisle(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.inventoryUrl}/aisles/${id}`)
      .pipe(map(() => undefined));
  }

  // ===== Bin API =====

  /**
   * Get bins for an aisle
   * GET /aisles/:aisleId/bins
   */
  getBins(aisleId: string, params?: { page?: number; limit?: number; search?: string }): Observable<{ items: Bin[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiPaginatedResponse<Bin>>(`${this.inventoryUrl}/aisles/${aisleId}/bins`, { params: httpParams })
      .pipe(map((response) => ({
        items: response.data?.items || [],
        total: response.data?.total || 0,
      })));
  }

  /**
   * Create a bin in an aisle
   * POST /aisles/:aisleId/bins
   */
  createBin(aisleId: string, dto: CreateBinDto): Observable<Bin> {
    return this.http
      .post<ApiResponse<{ item: Bin }>>(`${this.inventoryUrl}/aisles/${aisleId}/bins`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update a bin
   * PUT /bins/:id
   */
  updateBin(id: string, dto: UpdateBinDto): Observable<Bin> {
    return this.http
      .put<ApiResponse<{ item: Bin }>>(`${this.inventoryUrl}/bins/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete a bin
   * DELETE /bins/:id
   */
  deleteBin(id: string, force = false): Observable<void> {
    const params = force ? new HttpParams().set('force', 'true') : undefined;
    return this.http
      .delete<ApiResponse<null>>(`${this.inventoryUrl}/bins/${id}`, { params })
      .pipe(map(() => undefined));
  }

  /**
   * Block a bin
   * POST /bins/:id/block
   */
  blockBin(id: string): Observable<Bin> {
    return this.http
      .post<ApiResponse<Bin>>(`${this.inventoryUrl}/bins/${id}/block`, {})
      .pipe(map((response) => response.data!));
  }

  /**
   * Unblock a bin
   * POST /bins/:id/unblock
   */
  unblockBin(id: string): Observable<Bin> {
    return this.http
      .post<ApiResponse<Bin>>(`${this.inventoryUrl}/bins/${id}/unblock`, {})
      .pipe(map((response) => response.data!));
  }

  // ===== Layout API =====

  /**
   * Get warehouse layout + all layout objects
   * GET /warehouses/:warehouseId/layout
   */
  getLayout(warehouseId: string): Observable<{ layout: WarehouseLayout | null; objects: LayoutObject[] }> {
    return this.http
      .get<ApiResponse<{ layout: WarehouseLayout | null; objects: LayoutObject[] }>>(
        `${this.baseUrl}/${warehouseId}/layout`,
      )
      .pipe(map((response) => response.data ?? { layout: null, objects: [] }));
  }

  /**
   * Create initial layout for a warehouse
   * POST /warehouses/:warehouseId/layout
   */
  createLayout(warehouseId: string, dto: CreateLayoutDto): Observable<WarehouseLayout> {
    return this.http
      .post<ApiResponse<{ item: WarehouseLayout }>>(`${this.baseUrl}/${warehouseId}/layout`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Update warehouse layout metadata
   * PUT /warehouses/:warehouseId/layout
   */
  updateLayout(warehouseId: string, dto: Partial<CreateLayoutDto>): Observable<WarehouseLayout> {
    return this.http
      .put<ApiResponse<{ item: WarehouseLayout }>>(`${this.baseUrl}/${warehouseId}/layout`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Create a layout object
   * POST /warehouses/:warehouseId/layout/objects
   */
  createLayoutObject(warehouseId: string, dto: CreateLayoutObjectDto): Observable<LayoutObject> {
    return this.http
      .post<ApiResponse<{ item: LayoutObject }>>(
        `${this.baseUrl}/${warehouseId}/layout/objects`,
        dto,
      )
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Batch create/update layout objects
   * POST /warehouses/:warehouseId/layout/objects/batch
   */
  batchSaveLayoutObjects(
    warehouseId: string,
    objects: Array<Partial<CreateLayoutObjectDto> & { id?: string }>,
  ): Observable<LayoutObject[]> {
    return this.http
      .post<ApiResponse<LayoutObject[]>>(
        `${this.baseUrl}/${warehouseId}/layout/objects/batch`,
        { objects },
      )
      .pipe(map((response) => response.data ?? []));
  }

  /**
   * Update a layout object (position, size, properties)
   * PATCH /layout/objects/:id
   */
  updateLayoutObject(id: string, dto: Partial<CreateLayoutObjectDto>): Observable<LayoutObject> {
    return this.http
      .patch<ApiResponse<{ item: LayoutObject }>>(`${this.inventoryUrl}/layout/objects/${id}`, dto)
      .pipe(map((response) => response.data?.item!));
  }

  /**
   * Delete a layout object
   * DELETE /layout/objects/:id
   */
  deleteLayoutObject(id: string, force = false): Observable<void> {
    const params = force ? new HttpParams().set('force', 'true') : undefined;
    return this.http
      .delete<ApiResponse<null>>(`${this.inventoryUrl}/layout/objects/${id}`, { params })
      .pipe(map(() => undefined));
  }
}
