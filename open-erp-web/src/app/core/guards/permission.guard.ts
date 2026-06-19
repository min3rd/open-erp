import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@open-erp/shared';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If not authenticated, redirect to login
    if (!authService.accessToken()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    // Fallback to home page if not permitted
    router.navigate(['/home']);
    return false;
  };
};
