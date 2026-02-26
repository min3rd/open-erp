import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let newReq = req;
  if (authService.accessToken && !authService.isExpired(authService.accessToken)) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authService.accessToken}`),
    });
  }

  return next(newReq).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Prevent infinite refresh loops: if this request was already retried, logout
      if (req.headers.has('X-Retry-Attempted')) {
        authService.logOut().subscribe();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      // No refresh token available; pass the error through without attempting refresh
      if (!authService.refreshToken) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another refresh is in progress — wait for it, then retry this request
        return refreshTokenSubject.pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((token) =>
            next(
              req.clone({
                headers: req.headers
                  .set('Authorization', `Bearer ${token}`)
                  .set('X-Retry-Attempted', '1'),
              }),
            ),
          ),
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshAccessToken().pipe(
        switchMap((accessToken) => {
          isRefreshing = false;
          refreshTokenSubject.next(accessToken);
          return next(
            req.clone({
              headers: req.headers
                .set('Authorization', `Bearer ${accessToken}`)
                .set('X-Retry-Attempted', '1'),
            }),
          );
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          refreshTokenSubject.next(null);
          authService.logOut().subscribe();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
