import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WarehouseService, QueryWarehouseParams } from '../../../../../../core/services/warehouse/warehouse.service';
import { WarehouseListResponse } from '../warehouse.types';

export const warehouseListResolver: ResolveFn<WarehouseListResponse | null> = (
  route: ActivatedRouteSnapshot
): Observable<WarehouseListResponse | null> => {
  const service = inject(WarehouseService);
  
  // Get route parameters
  const search = route.paramMap.get('search') || '';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);

  // Build params
  const params: QueryWarehouseParams = {
    page,
    limit,
  };

  // Add search if provided
  if (search && search !== '-') {
    params.search = search;
  }

  return service.getWarehouses(params).pipe(
    map((response: { items: any[]; total: number; page: number; limit: number }) => ({
      items: response.items,
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: Math.ceil(response.total / response.limit),
      query: params,
    })),
    catchError((error: any) => {
      console.error('Failed to load warehouses:', error);
      return of(null);
    })
  );
};
