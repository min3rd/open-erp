import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlatformAdminRole } from '@shared';
import { AuthService } from '../services/auth.service';
import { ImpersonationService } from '../services/impersonation.service';
import { decodeJwtPayload } from '../utils/jwt.util';

/**
 * Platform portal guard (DES-02-UI §7.1, synced with backend
 * `PlatformRoleRequiredFilter`): both platform roles may enter the portal.
 * `SUPPORT_ENGINEER` is read-only — mutating actions are hidden/disabled in the
 * UI and rejected server-side (403).
 * Tenant users are redirected back to the tenant dashboard.
 */
export const platformRoleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const impersonation = inject(ImpersonationService);
  const router = inject(Router);

  if (impersonation.isActive()) {
    return router.createUrlTree(['/dashboard']);
  }

  if (hasPlatformRole(auth, PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.SUPPORT_ENGINEER)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

/**
 * Sensitive platform administration guard: `/platform/admins` (admin lifecycle
 * grant/disable/enable/revoke) is `SUPER_ADMIN` only, matching
 * `PlatformRoleRequiredFilter` which blocks the whole `/admins` subtree for
 * `SUPPORT_ENGINEER`.
 */
export const platformSuperAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const impersonation = inject(ImpersonationService);
  const router = inject(Router);

  if (impersonation.isActive()) {
    return router.createUrlTree(['/dashboard']);
  }

  if (hasPlatformRole(auth, PlatformAdminRole.SUPER_ADMIN)) {
    return true;
  }

  return router.createUrlTree(['/platform/tenants']);
};

function hasPlatformRole(auth: AuthService, ...allowed: PlatformAdminRole[]): boolean {
  const payload = decodeJwtPayload(auth.token());
  const platformRole = payload?.['platform_role'];
  const groups = payload?.['groups'];
  if (typeof platformRole !== 'string' || !allowed.includes(platformRole as PlatformAdminRole)) {
    return false;
  }
  return Array.isArray(groups) && groups.includes(platformRole);
}
