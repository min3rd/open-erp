import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized or 419 Custom Token Expired
      if (
        (error.status === 401 || error.status === 419) &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            if (res.success && res.data?.accessToken) {
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${res.data.accessToken}`),
              });
              return next(retryReq);
            }
            authService.accessToken.set(null);
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            authService.accessToken.set(null);
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
