import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProvinceService } from '../../province/services/province.service';
import { Province } from '../../province/province.types';

/**
 * Resolver to preload provinces list for admin units screen
 */
export const provincesResolver: ResolveFn<Province[]> = () => {
  const provinceService = inject(ProvinceService);

  // Load provinces - Vietnam has 63 provinces, so 100 is sufficient
  // If this becomes a concern, implement pagination at the component level
  return provinceService.getProvinces({ page: 1, limit: 100 }).pipe(
    map((response) => response.items),
    catchError((error) => {
      console.error('Failed to load provinces in resolver:', error);
      // Return empty array to allow page to load even if API fails
      return of([]);
    }),
  );
};
