import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  if (token && !auth.isTokenExpired(token)) {
    return true;
  }

  if (token && auth.hasRefreshToken()) {
    return true;
  }

  if (token) {
    auth.clearSession(false);
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
