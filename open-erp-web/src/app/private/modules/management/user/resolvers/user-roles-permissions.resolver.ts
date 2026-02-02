import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  UserDetailService,
  UserRolesPermissions,
  OrganizationBasic,
} from '../services/user-detail.service';

/**
 * Data structure for roles and permissions resolver
 */
export interface UserRolesPermissionsData {
  rolesPermissions: UserRolesPermissions | null;
  organizations: OrganizationBasic[];
}

/**
 * Resolver for user roles and permissions
 * Fetches user roles, permissions, and organizations before the route is activated
 */
export const userRolesPermissionsResolver: ResolveFn<UserRolesPermissionsData | null> = (
  route: ActivatedRouteSnapshot
): Observable<UserRolesPermissionsData | null> => {
  const userDetailService = inject(UserDetailService);
  const userId = route.parent?.paramMap.get('id');

  if (!userId) {
    return of(null);
  }

  // Fetch both roles/permissions and organizations in parallel
  return forkJoin({
    rolesPermissions: userDetailService.getUserRolesPermissions(userId).pipe(
      catchError((error) => {
        console.error('Failed to resolve user roles/permissions:', error);
        return of(null);
      })
    ),
    organizations: userDetailService.getUserOrganizations(userId).pipe(
      catchError((error) => {
        console.error('Failed to resolve user organizations:', error);
        return of([]);
      })
    ),
  }).pipe(
    map((result) => ({
      rolesPermissions: result.rolesPermissions,
      organizations: result.organizations,
    }))
  );
};
