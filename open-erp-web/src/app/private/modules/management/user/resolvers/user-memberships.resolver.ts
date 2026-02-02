import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserDetailService, UserMembership } from '../services/user-detail.service';

/**
 * Resolver for user memberships
 * Fetches user membership data before the route is activated
 */
export const userMembershipsResolver: ResolveFn<UserMembership[] | null> = (
  route: ActivatedRouteSnapshot
): Observable<UserMembership[] | null> => {
  const userDetailService = inject(UserDetailService);
  const userId = route.parent?.paramMap.get('id');

  if (!userId) {
    return of(null);
  }

  return userDetailService.getUserMemberships(userId).pipe(
    catchError((error) => {
      console.error('Failed to resolve user memberships:', error);
      return of(null);
    })
  );
};
