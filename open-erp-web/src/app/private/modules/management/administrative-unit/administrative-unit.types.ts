import { TreeNode } from 'primeng/api';
import { Province } from '../province/province.types';
import { District } from '../district/district.types';
import { Ward } from '../ward/ward.types';

/**
 * Type of administrative unit
 */
export enum AdminUnitType {
  PROVINCE = 'province',
  DISTRICT = 'district',
  WARD = 'ward',
}

/**
 * Administrative unit interface combining Province, District, and Ward
 */
export interface AdministrativeUnit {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: AdminUnitType;
  parentCode?: string;
  provinceCode?: string;
  districtCode?: string;
  region?: string;
  sortOrder?: number;
  version?: string;
  isLegacy?: boolean;
  geometry?: GeoJSON.Geometry;
  geometrySimplified?: GeoJSON.Geometry;
  centroid?: { lat: number; lon: number };
  bbox?: number[];
  areaSqKm?: number;
  population?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Extended TreeNode with administrative unit data
 */
export interface AdministrativeUnitTreeNode extends TreeNode<AdministrativeUnit> {
  data: AdministrativeUnit;
  children?: AdministrativeUnitTreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

/**
 * Parameters for fetching administrative unit tree data
 */
export interface AdminUnitTreeParams {
  page?: number;
  limit?: number;
  filter?: string;
  includeDistricts?: boolean;
  includeWards?: boolean;
  expandAll?: boolean;
}

/**
 * Response from tree data API
 */
export interface AdminUnitTreeResponse {
  items: AdministrativeUnitTreeNode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO for creating/updating administrative units
 */
export interface AdminUnitFormData {
  code: string;
  name: string;
  nameEn?: string;
  type: AdminUnitType;
  parentCode?: string;
  provinceCode?: string;
  districtCode?: string;
  region?: string;
  population?: number;
  geometry?: GeoJSON.Geometry;
  note?: string;
}

/**
 * Convert Province to AdministrativeUnit
 */
export function provinceToAdminUnit(province: Province): AdministrativeUnit {
  return {
    id: province.id,
    code: province.code,
    name: province.name,
    nameEn: undefined,
    type: AdminUnitType.PROVINCE,
    parentCode: undefined,
    provinceCode: undefined,
    districtCode: undefined,
    region: province.region,
    sortOrder: undefined,
    version: undefined,
    isLegacy: undefined,
    geometry: province.geometry,
    geometrySimplified: undefined,
    centroid: undefined,
    bbox: undefined,
    areaSqKm: undefined,
    population: undefined,
    note: undefined,
    createdAt: province.createdAt,
    updatedAt: province.updatedAt,
  };
}

/**
 * Convert District to AdministrativeUnit
 */
export function districtToAdminUnit(district: District): AdministrativeUnit {
  return {
    id: district.id,
    code: district.code,
    name: district.name,
    nameEn: district.nameEn,
    type: AdminUnitType.DISTRICT,
    parentCode: district.provinceCode,
    provinceCode: district.provinceCode,
    sortOrder: district.sortOrder,
    version: district.version,
    isLegacy: district.isLegacy,
    geometry: district.geometry,
    geometrySimplified: district.geometrySimplified,
    centroid: district.centroid,
    bbox: district.bbox,
    areaSqKm: district.areaSqKm,
    createdAt: district.createdAt,
    updatedAt: district.updatedAt,
  };
}

/**
 * Convert Ward to AdministrativeUnit
 */
export function wardToAdminUnit(ward: Ward): AdministrativeUnit {
  return {
    id: ward.id,
    code: ward.code,
    name: ward.name,
    nameEn: ward.nameEn,
    type: AdminUnitType.WARD,
    parentCode: ward.districtCode,
    provinceCode: ward.provinceCode,
    districtCode: ward.districtCode,
    sortOrder: ward.sortOrder,
    version: ward.version,
    isLegacy: ward.isLegacy,
    geometry: ward.geometry,
    geometrySimplified: ward.geometrySimplified,
    centroid: ward.centroid,
    bbox: ward.bbox,
    areaSqKm: ward.areaSqKm,
    note: ward.note,
    createdAt: ward.createdAt,
    updatedAt: ward.updatedAt,
  };
}

/**
 * Map AdministrativeUnit to TreeNode
 */
export function mapToTreeNode(
  unit: AdministrativeUnit,
  hasChildren: boolean = false
): AdministrativeUnitTreeNode {
  return {
    data: unit,
    leaf: !hasChildren,
    expanded: false,
    loading: false,
    children: hasChildren ? [] : undefined,
  };
}
