import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { ProductCategory } from '../product-category.types';

/**
 * Resolver for parent categories
 * Fetches all active categories that can be used as parent options
 */
export const parentCategoriesResolver: ResolveFn<ProductCategory[]> = () => {
  const service = inject(ProductCategoryService);

  // Fetch all active categories for parent selection
  return service
    .getProductCategories({ limit: 1000, isActive: true })
    .pipe(map((response) => response.items || []));
};
