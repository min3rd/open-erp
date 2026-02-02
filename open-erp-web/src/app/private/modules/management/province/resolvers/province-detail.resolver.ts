import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProvinceService } from '../services/province.service';
import { Province } from '../province.types';

/**
 * Resolver for province detail
 * Fetches province data before the route is activated
 */
export const provinceDetailResolver: ResolveFn<Province | null> = (
  route: ActivatedRouteSnapshot
): Observable<Province | null> => {
  const provinceService = inject(ProvinceService);
  const provinceId = route.paramMap.get('id');

  if (!provinceId) {
    return of(null);
  }

  return provinceService.getProvince(provinceId).pipe(
    catchError((error) => {
      console.error('Failed to resolve province detail:', error);
      return of(null);
    })
  );
};
