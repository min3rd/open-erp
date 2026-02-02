import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProvinceService } from '../services/province.service';
import { ProvinceListResponse } from '../province.types';

/**
 * Resolver for province list
 * Pre-loads province list data before the route is activated
 * For ward list, we need all provinces for grouping, so use a large limit
 */
export const provinceListResolver: ResolveFn<ProvinceListResponse | null> = (
  route: ActivatedRouteSnapshot
): Observable<ProvinceListResponse | null> => {
  const provinceService = inject(ProvinceService);
  
  // Get pagination params from route
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '1000', 10); // Large limit to get all provinces
  const filter = route.paramMap.get('filter') || 'all';
  
  // Get search query from query params
  const search = filter !== 'all' ? filter : undefined;

  return provinceService.getProvinces({ page, limit, search }).pipe(
    catchError((error) => {
      console.error('Failed to resolve province list:', error);
      return of(null);
    })
  );
};
