import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@open-erp/shared';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If not authenticated, redirect to login
    if (!authService.accessToken()) {
      router.navigate(['/login']);
      return false;
    }

    // If permissions are already loaded, check immediately
    if (authService.permissions().length > 0) {
      if (authService.hasPermission(requiredPermission)) {
        return true;
      }
      router.navigate(['/home']);
      return false;
    }

    // If token exists but permissions are not loaded yet, fetch them first
    return authService.fetchProfileAndPermissions().pipe(
      map(() => {
        if (authService.hasPermission(requiredPermission)) {
          return true;
        }
        router.navigate(['/home']);
        return false;
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
};
