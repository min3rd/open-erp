import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { ProductCategory } from '../product-category.types';

/**
 * Resolver for product category list
 * Fetches product categories based on route params (search, page, limit)
 */
export const productCategoryListResolver: ResolveFn<{
  items: ProductCategory[];
  total: number;
  page: number;
  limit: number;
}> = (route: ActivatedRouteSnapshot) => {
  const service = inject(ProductCategoryService);
  
  const search = route.paramMap.get('search') || '';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);
  
  // Build query params
  const params: any = {
    page,
    limit,
  };
  
  // Add search if not empty or dash
  if (search && search !== '-') {
    params.search = search;
  }
  
  return service.getProductCategories(params);
};
