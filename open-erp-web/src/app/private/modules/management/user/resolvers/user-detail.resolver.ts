import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserDetailService, UserDetail } from '../services/user-detail.service';

/**
 * Resolver for user detail
 * Fetches user data before the route is activated
 */
export const userDetailResolver: ResolveFn<UserDetail | null> = (
  route: ActivatedRouteSnapshot,
): Observable<UserDetail | null> => {
  const userDetailService = inject(UserDetailService);
  const userId = route.paramMap.get('id');

  if (!userId) {
    return of(null);
  }

  return userDetailService.getUserDetail(userId).pipe(
    catchError((error) => {
      console.error('Failed to resolve user detail:', error);
      return of(null);
    }),
  );
};
