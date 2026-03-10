import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { ProductCategory } from '../product-category.types';

/**
 * Resolver for product category list
 * Fetches product categories based on route params (search, filter, sort, page, limit)
 */
export const productCategoryListResolver: ResolveFn<{
  items: ProductCategory[];
  total: number;
  page: number;
  limit: number;
}> = (route: ActivatedRouteSnapshot) => {
  const service = inject(ProductCategoryService);

  const search = route.params['search'] || '';
  const filter = route.params['filter'] || 'all';
  const sort = route.params['sort'] || '[name,asc]';
  const page = parseInt(route.params['page'] || '1', 10);
  const limit = parseInt(route.params['limit'] || '100', 10);

  // Parse filter (all, active, inactive)
  let isActive: boolean | undefined = undefined;
  if (filter === 'active') {
    isActive = true;
  } else if (filter === 'inactive') {
    isActive = false;
  }

  // Build query params
  const params: any = {
    page,
    limit,
    sort,
  };

  // Add search if not empty or dash
  if (search && search !== '-') {
    params.search = search;
  }

  // Add filter if specified
  if (isActive !== undefined) {
    params.isActive = isActive;
  }

  return service.getProductCategories(params);
};
