import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlatformAdminRole } from '@shared';
import { AuthService } from '../services/auth.service';
import { ImpersonationService } from '../services/impersonation.service';
import { decodeJwtPayload } from '../utils/jwt.util';

export const platformRoleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const impersonation = inject(ImpersonationService);
  const router = inject(Router);

  if (impersonation.isActive()) {
    return router.createUrlTree(['/dashboard']);
  }

  const payload = decodeJwtPayload(auth.token());
  const platformRole = payload?.['platform_role'];
  const groups = payload?.['groups'];
  const hasPlatformRole = platformRole === PlatformAdminRole.SUPER_ADMIN;
  const hasGroup = Array.isArray(groups) && groups.includes(PlatformAdminRole.SUPER_ADMIN);

  if (hasPlatformRole && hasGroup) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
