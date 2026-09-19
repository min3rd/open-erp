import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Platform guard (DES-02-UI §7.1, BUG-65): the JWT must carry both
 * `platform_role = "SUPER_ADMIN"` and `groups` containing `"SUPER_ADMIN"`.
 * Tenant users are redirected back to the tenant dashboard.
 * Impersonation is intentionally NOT exposed on Mobile (ANL-01 §3).
 */
export const platformRoleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.isPlatformAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
