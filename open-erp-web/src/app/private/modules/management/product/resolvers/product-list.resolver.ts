import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductService, Product, ProductStatus } from '../../../../../../core/services/product/product.service';
import { catchError, of } from 'rxjs';

/**
 * Resolver for product list data
 * Pre-loads product list based on route params before navigation
 */
export const productListResolver: ResolveFn<
  { items: Product[]; total: number; page: number; limit: number } | null
> = (route: ActivatedRouteSnapshot) => {
  const productService = inject(ProductService);

  // Extract params from route
  const page = parseInt(route.params['page'], 10) || 1;
  const limit = parseInt(route.params['limit'], 10) || 100;
  const search = route.params['search'] || '';
  const filter = route.params['filter'] || 'all';
  const sort = route.params['sort'] || '[name,asc]';

  // Parse filter (status filter)
  let status: ProductStatus | undefined;
  if (filter !== 'all') {
    status = filter as ProductStatus;
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
