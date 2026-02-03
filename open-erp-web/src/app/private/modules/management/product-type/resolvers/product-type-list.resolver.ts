import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ProductTypeService,
  QueryProductTypeParams,
} from '../../../../../../core/services/product-type/product-type.service';
import { ProductTypeListResponse } from '../product-type.types';

export const productTypeListResolver: ResolveFn<ProductTypeListResponse | null> = (
  route: ActivatedRouteSnapshot
): Observable<ProductTypeListResponse | null> => {
  const service = inject(ProductTypeService);

  // Get route parameters
  const search = route.paramMap.get('search') || '';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);

  // Build params
  const params: QueryProductTypeParams = {
    page,
    limit,
  };

  // Add search if provided
  if (search && search !== '-') {
    params.search = search;
  }

  return service.getProductTypes(params).pipe(
    map((response: { items: any[]; total: number; page: number; limit: number }) => ({
      items: response.items,
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: Math.ceil(response.total / response.limit),
      query: params,
    })),
    catchError((error: any) => {
      console.error('Failed to load product types:', error);
      return of(null);
    })
  );
};
