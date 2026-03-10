import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { of, switchMap } from 'rxjs';

export const privateGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  return authService.isAuthenticated().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        const urlTree = router.createUrlTree(['/auth/login'], {
          queryParams:
            state.url && state.url !== '/auth/login-out' ? { redirectURL: state.url } : undefined,
        });
        return of(urlTree);
      }
      return of(authenticated);
    }),
  );
};
