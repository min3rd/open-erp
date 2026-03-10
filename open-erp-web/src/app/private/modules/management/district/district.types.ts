/**
 * District model matching backend common-service district.controller.ts and district.schema.ts
 */
import type { Geometry } from 'geojson';

export interface District {
  id: string;
  code: string;
  name: string; // Vietnamese name (primary)
  nameEn?: string; // English name (optional)
  provinceCode: string;
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
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Parameters for getting districts
 */
export interface GetDistrictsParams {
  page?: number;
  limit?: number;
  q?: string; // Search query
  provinceCode?: string;
  version?: string;
  isLegacy?: boolean;
}

/**
 * Create district DTO
 */
export interface CreateDistrictDto {
  code: string;
  name: string;
  nameEn?: string;
  provinceCode: string;
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
}

/**
 * Update district DTO
 */
export interface UpdateDistrictDto {
  code?: string;
  name?: string;
  nameEn?: string;
  provinceCode?: string;
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
}

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
