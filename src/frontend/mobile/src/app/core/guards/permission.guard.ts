import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Tenant functional permission guard (DES-02-UI §7.1).
 *
 * TODO(shared-sync/BUG-67): when the Sprint 02 backend emits the `permissions`
 * claim, `AuthService.hasPermission()` returns true/false and this guard blocks
 * strictly. While the claim is absent it returns `null` → fallback allow
 * (menu/UX still usable in dev); backend endpoints remain the source of truth.
 */
export const permissionGuard = (permission: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.hasPermission(permission) === false) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
