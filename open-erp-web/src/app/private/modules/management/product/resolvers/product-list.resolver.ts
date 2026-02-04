import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductService, Product, ProductStatus } from '../../../../../../core/services/product/product.service';
import { catchError, of } from 'rxjs';

/**
 * Resolver for product list data
 * Pre-loads product list based on route params before navigation
 * 
 * Route pattern: /:search/:status/:type/:category/:sort/:page/:limit
 */
export const productListResolver: ResolveFn<
  { items: Product[]; total: number; page: number; limit: number } | null
> = (route: ActivatedRouteSnapshot) => {
  const productService = inject(ProductService);

  // Extract params from route
  const page = parseInt(route.params['page'], 10) || 1;
  const limit = parseInt(route.params['limit'], 10) || 100;
  const search = route.params['search'] || '';
  const statusFilter = route.params['status'] || 'all';
  const typeFilter = route.params['type'] || 'all';
  const categoryFilter = route.params['category'] || 'all';
  const sort = route.params['sort'] || '[name,asc]';

  // Parse status filter
  let status: ProductStatus | undefined;
  if (statusFilter !== 'all') {
    status = statusFilter as ProductStatus;
  }

  // Parse type filter
  let type: string | undefined;
  if (typeFilter !== 'all') {
    type = typeFilter;
  }

  // Parse category filter
  let category: string | undefined;
  if (categoryFilter !== 'all') {
    category = categoryFilter;
  }

  // Parse sort string format: [field,order]
  let sortParam: string | undefined;
  if (sort) {
    const sortStr = sort.replace(/[\[\]]/g, '');
    const sortParts = sortStr.split(',');
    if (sortParts.length === 2) {
      const [field, order] = sortParts;
      sortParam = `${field}:${order}`;
    }
  }

  // Build query params
  const params: any = {
    page,
    limit,
  };

  if (search && search !== '-') {
    params.search = search;
  }

  if (status) {
    params.status = status;
  }

  if (type) {
    params.type = type;
  }

  if (category) {
    params.category = category;
  }

  if (sortParam) {
    params.sort = sortParam;
  }

  // Fetch data
  return productService.getProducts(params).pipe(
    catchError((error) => {
      console.error('Error loading products:', error);
      return of(null);
    })
  );
};
