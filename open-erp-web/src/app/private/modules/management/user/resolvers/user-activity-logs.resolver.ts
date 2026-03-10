import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserDetailService, UserActivityLogsResponse } from '../services/user-detail.service';

/**
 * Resolver for user activity logs
 * Fetches user activity logs before the route is activated
 */
export const userActivityLogsResolver: ResolveFn<UserActivityLogsResponse | null> = (
  route: ActivatedRouteSnapshot,
): Observable<UserActivityLogsResponse | null> => {
  const userDetailService = inject(UserDetailService);
  const userId = route.parent?.paramMap.get('id');

  if (!userId) {
    return of(null);
  }

  return userDetailService.getUserActivityLogs(userId, 1, 20, undefined, 'timestamp', 'desc').pipe(
    catchError((error) => {
      console.error('Failed to resolve user activity logs:', error);
      return of(null);
    }),
  );
};
