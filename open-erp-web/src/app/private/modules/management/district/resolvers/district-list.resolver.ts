import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DistrictService } from '../services/district.service';

/**
 * Resolver for district list
 * Pre-loads district list data before the route is activated
 * For ward list, we need all districts, so use a large limit
 */
export const districtListResolver: ResolveFn<
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
  const districtService = inject(DistrictService);

  // Get pagination params from route
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '10000', 10); // Large limit to get all districts
  const filter = route.paramMap.get('filter') || 'all';
  const provinceFilter = route.paramMap.get('provinceFilter') || 'all-provinces';

  // Get search query and province filter
  const q = filter !== 'all' ? filter : undefined;
  const provinceCode = provinceFilter !== 'all-provinces' ? provinceFilter : undefined;

  return districtService.getDistricts({ page, limit, q, provinceCode }).pipe(
    catchError((error) => {
      console.error('Failed to resolve district list:', error);
      return of(null);
    }),
  );
};
