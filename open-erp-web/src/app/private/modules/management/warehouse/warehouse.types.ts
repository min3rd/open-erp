/**
 * Warehouse types matching backend DTOs exactly
 * Backend: apps/inventory/src/dto/warehouse.dto.ts
 */
import type { Geometry } from 'geojson';
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';
import type { Warehouse } from '../../../../../core/services/warehouse/warehouse.service';

// Re-export Warehouse type from service to avoid duplication
export type { Warehouse };

/**
 * Warehouse Type enum (from backend)
 */
export enum WarehouseType {
  GENERAL = 'general',
  COLD_STORAGE = 'cold_storage',
  BONDED = 'bonded',
  DISTRIBUTION_CENTER = 'distribution_center',
  CROSS_DOCK = 'cross_dock',
  AUTOMATED = 'automated',
  HAZMAT = 'hazmat',
  PHARMACEUTICAL = 'pharmaceutical',
  FOOD_GRADE = 'food_grade',
  TEXTILE = 'textile',
  ELECTRONICS = 'electronics',
  CUSTOMS = 'customs',
}

/**
 * Warehouse Status enum (from backend)
 */
export enum WarehouseStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

/**
 * Capacity Unit enum
 */
export enum CapacityUnit {
  TON = 'TON',
  PALLET = 'PALLET',
  M3 = 'M3',
  CONTAINER = 'CONTAINER',
}

/**
 * Security Level enum
 */
export enum SecurityLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

/**
 * Working Shift enum
 */
export enum WorkingShift {
  DAY = 'day',
  NIGHT = 'night',
  FULL_TIME = 'full_time',
  TWENTY_FOUR_SEVEN = '24/7',
}

/**
 * Region enum
 */
export enum Region {
  NORTHERN = 'northern',
  CENTRAL = 'central',
  SOUTHERN = 'southern',
  HIGHLAND = 'highland',
}

/**
 * Payment Term enum
 */
export enum PaymentTerm {
  PREPAID = 'prepaid',
  NET_7 = 'net_7',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  COD = 'cod',
}

/**
 * Currency enum
 */
export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
}

/**
 * Special Condition enum
 */
export enum SpecialCondition {
  TEMPERATURE_CONTROLLED = 'temperature_controlled',
  HUMIDITY_CONTROLLED = 'humidity_controlled',
  HAZMAT_CERTIFIED = 'hazmat_certified',
  FOOD_SAFETY_CERTIFIED = 'food_safety_certified',
  PHARMACEUTICAL_CERTIFIED = 'pharmaceutical_certified',
  FIREPROOF = 'fireproof',
  EARTHQUAKE_RESISTANT = 'earthquake_resistant',
  FLOOD_PROTECTED = 'flood_protected',
  PEST_CONTROLLED = 'pest_controlled',
  CLEAN_ROOM = 'clean_room',
}

/**
 * Province DTO
 */
export interface ProvinceDto {
  code: string;
  name: string;
}

/**
 * Ward DTO
 */
export interface WardDto {
  code: string;
  name: string;
}

/**
 * Location DTO (GeoJSON Point)
 */
export interface LocationDto {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Manager DTO
 */
export interface ManagerDto {
  id?: string;
  name: string;
}

/**
 * Camera System DTO
 */
export interface CameraSystemDto {
  cameraCount?: number;
  coverage?: string;
  recordingDays?: number;
  isAIEnabled?: boolean;
}

/**
 * Access Control DTO
 */
export interface AccessControlDto {
  system?: string;
  biometric?: boolean;
  cardAccess?: boolean;
  securityGuards?: number;
}

/* NOTE: Warehouse interface removed from here - now re-exported from service at top of file */

/**
 * Create Warehouse DTO matching backend exactly
 */
export interface CreateWarehouseDto {
  warehouseId?: string;
  code: string;
  name: string;
  type: WarehouseType;
  status?: WarehouseStatus;
  organizationId?: string;
  businessLicense?: string;
  warehouseLicense?: string;
  customsCode?: string;
  addressDetail: string;
  ward: WardDto;
  province: ProvinceDto;
  region?: Region;
  location?: LocationDto;
  totalAreaM2?: number;
  usableAreaM2?: number;
  storageCapacity?: number;
  capacityUnit?: CapacityUnit;
  zonesCount?: number;
  racksCount?: number;
  floorsCount?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  specialConditions?: SpecialCondition[];
  manager?: ManagerDto;
  contactPhone?: string;
  contactEmail?: string;
  workersCount?: number;
  workingShift?: WorkingShift;
  operatingHours?: string;
  fireProtectionCert?: string;
  securityLevel?: SecurityLevel;
  cameraSystem?: CameraSystemDto;
  accessControl?: AccessControlDto;
  insurancePolicy?: string;
  storageFee?: number;
  handlingFee?: number;
  currency?: Currency;
  paymentTerm?: PaymentTerm;
  tenantId?: string;
}

/**
 * Update Warehouse DTO
 */
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

/**
 * Query parameters for warehouse list
 */
export interface QueryWarehouseParams {
  page?: number;
  limit?: number;
  type?: WarehouseType;
  status?: WarehouseStatus;
  provinceCode?: string;
  wardCode?: string;
  region?: Region;
  tenantId?: string;
  search?: string;
  bbox?: string; // longitude,latitude,radiusKm
}

/**
 * Warehouse list response with pagination
 */
export type WarehouseListResponse = ApiPaginatedData<Warehouse>;

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Zone Type enum
 */
export enum ZoneType {
  STORAGE = 'storage',
  STAGING = 'staging',
  RECEIVING = 'receiving',
  SHIPPING = 'shipping',
  QUARANTINE = 'quarantine',
  RETURN = 'return',
  COLD = 'cold',
  HAZMAT = 'hazmat',
}

/**
 * Zone entity
 */
export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type: ZoneType;
  sequence: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateZoneDto {
  code: string;
  name: string;
  type?: ZoneType;
  sequence?: number;
  isDefault?: boolean;
  isActive?: boolean;
  description?: string;
}

export type UpdateZoneDto = Partial<CreateZoneDto>;

/**
 * Aisle entity
 */
export interface Aisle {
  id: string;
  zoneId: string;
  code: string;
  name: string;
  sequence: number;
  levels: number;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
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

/**
 * Bin Type enum
 */
export enum BinType {
  STANDARD = 'standard',
  PALLET = 'pallet',
  BULK = 'bulk',
  SHELF = 'shelf',
  FLOOR = 'floor',
  RACK = 'rack',
  DRAWER = 'drawer',
}

export interface BinDimensions {
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

/**
 * Bin entity
 */
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
  binType: BinType;
  isBlocked: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
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
  binType?: BinType;
  isBlocked?: boolean;
  isActive?: boolean;
}

export type UpdateBinDto = Partial<CreateBinDto>;

/**
 * Warehouse structure tree (Warehouse → Zones → Aisles → Bins)
 */
export interface AisleWithBins extends Aisle {
  bins: Bin[];
}

export interface ZoneWithAisles extends Zone {
  aisles: AisleWithBins[];
}

export interface WarehouseStructure extends Warehouse {
  zones: ZoneWithAisles[];
}
