import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService, ConfigService } from '@open-erp/shared';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const configService = inject(ConfigService);
  const token = authService.accessToken();

  // Mobile client always retrieves subdomain and tenantId from localStorage
  const subdomain = localStorage.getItem('subdomain');
  const tenantId = localStorage.getItem('tenantId');

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (subdomain) {
    headers = headers.set('x-subdomain', subdomain);
  }
  if (tenantId) {
    headers = headers.set('x-tenant-id', tenantId);
  }

  let url = req.url;
  if (url.startsWith('/api/')) {
    url = `${configService.apiUrl}${url}`;
  }

  const authReq = req.clone({ url, headers, withCredentials: true });

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
                url: req.url.startsWith('/api/') ? `${configService.apiUrl}${req.url}` : req.url,
                headers: req.headers.set('Authorization', `Bearer ${res.data.accessToken}`),
                withCredentials: true,
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
