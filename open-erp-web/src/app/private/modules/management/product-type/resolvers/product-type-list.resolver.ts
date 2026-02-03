import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import type { QueryProductTypeParams } from '../product-type.types';

/**
 * Resolver for product type list
 * Pre-fetches product types before route activation
 */
export const productTypeListResolver: ResolveFn<{ items: any[]; total: number; page: number; limit: number }> = (
  route: ActivatedRouteSnapshot
) => {
  const productTypeService = inject(ProductTypeService);
  
  // Extract params from route
  const scope = route.paramMap.get('scope') || 'all';
  const search = route.paramMap.get('search');
  const page = Number(route.paramMap.get('page')) || 1;
  const limit = Number(route.paramMap.get('limit')) || 100;

  // Build query params
  const params: QueryProductTypeParams = {
    page,
    limit,
    search: search && search !== '-' ? search : undefined,
  };

  // Add scope filter
  if (scope === 'active') {
    params.isActive = true;
  } else if (scope === 'inactive') {
    params.isActive = false;
  }
  // 'all' scope doesn't need isActive filter

  return productTypeService.getProductTypes(params);
};
