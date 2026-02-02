import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DistrictService } from '../services/district.service';
import { District } from '../district.types';

/**
 * Resolver for district detail
 * Fetches district data before the route is activated
 */
export const districtDetailResolver: ResolveFn<District | null> = (
  route: ActivatedRouteSnapshot
): Observable<District | null> => {
  const districtService = inject(DistrictService);
  const districtCode = route.paramMap.get('code');

  if (!districtCode) {
    return of(null);
  }

  return districtService.getDistrict(districtCode).pipe(
    catchError((error) => {
      console.error('Failed to resolve district detail:', error);
      return of(null);
    })
  );
};
