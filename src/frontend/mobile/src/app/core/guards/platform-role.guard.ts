import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Platform guard (DES-02-UI §7.1, BUG-65, synced with backend
 * `PlatformRoleRequiredFilter`): the JWT must carry `platform_role` of
 * `SUPER_ADMIN` or `SUPPORT_ENGINEER` together with a matching `groups` entry.
 * Tenant users are redirected back to the tenant dashboard.
 * Impersonation is intentionally NOT exposed on Mobile (ANL-01 §3).
 *
 * The emergency route is reachable for both roles; lock/unlock actions are
 * rendered only for SUPER_ADMIN because the backend rejects all non-GET
 * platform calls from SUPPORT_ENGINEER (SOL-01 §1.2.7).
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
