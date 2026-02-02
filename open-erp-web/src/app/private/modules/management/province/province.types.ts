/**
 * Province model matching backend common-service province.controller.ts
 */
import type { Geometry } from 'geojson';
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';

export interface Province {
  id: string;
  code: string;
  name: string;
  region: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Province list response with pagination - uses core API interface
 */
export type ProvinceListResponse = ApiPaginatedData<Province>;

/**
 * Parameters for getting provinces
 */
export interface GetProvincesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
}

/**
 * Create province DTO
 */
export interface CreateProvinceDto {
  code: string;
  name: string;
  region: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Update province DTO
 */
export interface UpdateProvinceDto {
  code?: string;
  name?: string;
  region?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
