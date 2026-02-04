import { ProductScope, ProductStatus, Product } from '../../../../../core/services/product/product.service';

// Re-export types and enums for use in the product module
export { ProductScope, ProductStatus };
export type { Product };

/**
 * Filter option for product status
 */
export interface StatusFilterOption {
  label: string;
  value: 'all' | ProductStatus;
}

/**
 * Filter option for product type (loaded from API)
 */
export interface TypeFilterOption {
  label: string;
  value: string;
}
