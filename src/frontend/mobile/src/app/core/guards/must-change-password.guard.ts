import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Blocks platform navigation on Mobile while the platform JWT carries
 * `must_change_password = true` and funnels the admin to the mandatory
 * password change page.
 */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.mustChangePassword()) {
    return true;
  }

  return router.createUrlTree(['/platform/change-password']);
};
