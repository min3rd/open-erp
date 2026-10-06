import {
  HttpBackend,
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { STORAGE_KEY_SESSION_ID, STORAGE_KEY_TENANT_TOKEN } from '../storage-keys';

const REFRESH_TOKEN_KEY = 'openerp_refresh_token';
const USER_KEY = 'openerp_user';

interface RefreshEnvelope {
  data?: {
    access_token?: string;
  };
}

let refreshInFlight$: Observable<string> | null = null;

/** Public auth endpoints must never receive a stale token or session header. */
const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register/',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh',
  '/api/v1/auth/resend-verification',
  '/api/v1/auth/2fa/verify-login',
  '/api/v1/auth/select-tenant'
];

function clearSessionAndRedirect(router: Router): void {
  localStorage.removeItem(STORAGE_KEY_TENANT_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(STORAGE_KEY_SESSION_ID);
  localStorage.removeItem(USER_KEY);
  if (!router.url.startsWith('/login')) {
    void router.navigate(['/login']);
  }
}

function requestRefresh(httpBackend: HttpBackend): Observable<string> {
  if (!refreshInFlight$) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    refreshInFlight$ = httpBackend
      .handle(
        new HttpRequest(
          'POST',
          `${environment.apiBaseUrl}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
        )
      )
      .pipe(
        map((event) => {
          const response = event as HttpResponse<RefreshEnvelope>;
          const accessToken = response.body?.data?.access_token;
          if (!accessToken) {
            throw { code: 'AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED' };
          }
          localStorage.setItem(STORAGE_KEY_TENANT_TOKEN, accessToken);
          return accessToken;
        }),
        finalize(() => {
          refreshInFlight$ = null;
        }),
        shareReplay(1)
      );
  }
  return refreshInFlight$;
}

/**
 * Attaches the tenant token (and session id) to every non-public request so the
 * **shared** library services (e.g. `CatalogService` used by the catalogue
 * picker and the mobile browse page) are authenticated exactly like the
 * app-local `ApiService` calls, and recovers expired sessions via refresh.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const httpBackend = inject(HttpBackend);
  const router = inject(Router);

  const token = localStorage.getItem(STORAGE_KEY_TENANT_TOKEN);
  const sessionId = localStorage.getItem(STORAGE_KEY_SESSION_ID);
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));

  let authReq = req;
  if (!isPublicAuthRequest && (token || sessionId)) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    authReq = req.clone({ setHeaders: headers });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isAuthEndpoint = req.url.includes('/api/v1/auth/');
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!isUnauthorized || isAuthEndpoint || !refreshToken) {
        if (isUnauthorized && !isAuthEndpoint && !refreshToken) {
          clearSessionAndRedirect(router);
        }
        return throwError(() => error);
      }

      return requestRefresh(httpBackend).pipe(
        catchError(() => {
          clearSessionAndRedirect(router);
          return throwError(() => ({ code: 'AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED' }));
        }),
        switchMap((newToken) => next(authReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })))
      );
    })
  );
};
