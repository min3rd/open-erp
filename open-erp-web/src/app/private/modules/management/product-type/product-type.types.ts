import { ProductType } from '../../../../../core/services/product-type/product-type.service';

/**
 * Product Type list response from resolver
 */
export interface ProductTypeListResponse {
  items: ProductType[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  query?: Record<string, any>;
}

/**
 * Re-export types for convenience
 */
export type { ProductType } from '../../../../../core/services/product-type/product-type.service';
