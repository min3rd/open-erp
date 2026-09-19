import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function permissionGuard(requiredPermission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const allowed = auth.hasPermission(requiredPermission);
    // TODO(wave-3b): Sprint 02 backend is rolling out the `permissions` claim in the
    // tenant access token. While the claim is absent `hasPermission()` returns `null`
    // and navigation stays allowed (menu items remain visible) to avoid lock-out.
    if (allowed === null || allowed) {
      return true;
    }

    return router.createUrlTree(['/dashboard'], {
      queryParams: { denied: 'IAM_PERMISSION_DENIED_FUNCTIONAL', permission: requiredPermission }
    });
  };
}
