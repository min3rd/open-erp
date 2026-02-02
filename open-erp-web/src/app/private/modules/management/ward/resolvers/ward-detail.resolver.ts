import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WardService } from '../services/ward.service';
import { Ward } from '../ward.types';

/**
 * Resolver for ward detail
 * Pre-loads ward data before the route is activated
 */
export const wardDetailResolver: ResolveFn<Ward | null> = (
  route: ActivatedRouteSnapshot
): Observable<Ward | null> => {
  const wardService = inject(WardService);
  const code = route.paramMap.get('code');
  
  if (!code) {
    return of(null);
  }

  return wardService.getWard(code).pipe(
    catchError((error) => {
      console.error('Failed to resolve ward detail:', error);
      return of(null);
    })
  );
};
