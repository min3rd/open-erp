import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WardService } from '../services/ward.service';

// Default limit for loading wards per province
const DEFAULT_WARDS_PER_PROVINCE_LIMIT = 10000;

/**
 * Resolver for ward list
 * Note: With the new route structure, wards are loaded lazily per province
 * This resolver is kept for backward compatibility but may not be used
 */
export const wardListResolver: ResolveFn<
  { items: any[]; total: number; page: number; limit: number; totalPages: number } | null
> = (
  route: ActivatedRouteSnapshot,
): Observable<{
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null> => {
  const wardService = inject(WardService);

  // Get provinceCode from route params (new structure)
  const provinceCode = route.paramMap.get('provinceCode') || undefined;

  // Get search and sort from query params
  const search = route.queryParamMap.get('search') || undefined;
  const sort = route.queryParamMap.get('sort') as 'name:asc' | 'name:desc' | null;
  const page = parseInt(route.queryParamMap.get('page') || '1', 10);
  const limit = parseInt(
    route.queryParamMap.get('limit') || DEFAULT_WARDS_PER_PROVINCE_LIMIT.toString(),
    10,
  );

  return wardService
    .getWards({
      page,
      limit,
      q: search,
      provinceCode,
      sort: sort || 'name:asc',
    })
    .pipe(
      catchError((error) => {
        console.error('Failed to resolve ward list:', error);
        return of(null);
      }),
    );
};
