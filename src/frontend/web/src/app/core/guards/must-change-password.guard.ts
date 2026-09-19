import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks platform navigation while the platform JWT carries
 * `must_change_password = true` (FEAT-18 / DES-02-UI §4.7) and funnels the
 * admin to the mandatory password change screen.
 */
export const mustChangePasswordGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.mustChangePassword()) {
    return true;
  }

  if (state.url.startsWith('/platform/change-password')) {
    return true;
  }

  return router.createUrlTree(['/platform/change-password']);
};
