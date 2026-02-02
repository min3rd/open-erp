/**
 * Ward model matching backend common-service ward.controller.ts and ward.schema.ts
 */
import type { Geometry } from 'geojson';

export interface Ward {
  id: string;
  code: string;
  name: string; // Vietnamese name (primary)
  nameEn?: string; // English name (optional)
  provinceCode: string;
  districtCode: string;
  sortOrder?: number;
  version?: string;
  isLegacy?: boolean;
  geometry?: Geometry;
  geometrySimplified?: Geometry;
  centroid?: {
    lat: number;
    lon: number;
  };
  bbox?: number[];
  areaSqKm?: number;
  geometrySource?: string;
  geometryVersion?: number;
  geometryUpdatedAt?: string;
  geometryUpdatedBy?: string;
  geometryMeta?: Record<string, any>;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Parameters for getting wards
 */
export interface GetWardsParams {
  page?: number;
  limit?: number;
  q?: string; // Search query
  provinceCode?: string;
  districtCode?: string;
  version?: string;
  isLegacy?: boolean;
  sort?: 'name:asc' | 'name:desc'; // Sort by name (client-side)
}

/**
 * Create ward DTO
 */
export interface CreateWardDto {
  code: string;
  name: string;
  nameEn?: string;
  provinceCode: string;
  districtCode: string;
  sortOrder?: number;
  version?: string;
  isLegacy?: boolean;
  geometry?: Geometry;
  geometrySimplified?: Geometry;
  centroid?: {
    lat: number;
    lon: number;
  };
  bbox?: number[];
  areaSqKm?: number;
  geometrySource?: string;
  geometryMeta?: Record<string, any>;
  note?: string;
}

/**
 * Update ward DTO
 */
export interface UpdateWardDto {
  code?: string;
  name?: string;
  nameEn?: string;
  provinceCode?: string;
  districtCode?: string;
  sortOrder?: number;
  version?: string;
  isLegacy?: boolean;
  geometry?: Geometry;
  geometrySimplified?: Geometry;
  centroid?: {
    lat: number;
    lon: number;
  };
  bbox?: number[];
  areaSqKm?: number;
  geometrySource?: string;
  geometryMeta?: Record<string, any>;
  note?: string;
}

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
