import { HttpBackend, HttpErrorResponse, HttpHeaders, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IMPERSONATION_SESSION_KEY, IMPERSONATION_TOKEN_KEY } from '../services/impersonation.service';

const TOKEN_KEY = 'openerp_token';
const REFRESH_TOKEN_KEY = 'openerp_refresh_token';
const SESSION_ID_KEY = 'openerp_session_id';
const USER_KEY = 'openerp_user';

interface RefreshEnvelope {
  data?: {
    access_token?: string;
  };
}

let refreshInFlight$: Observable<string> | null = null;

function clearSessionAndRedirect(router: Router): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('openerp:session-expired'));
  if (!router.url.startsWith('/login')) {
    router.navigate(['/login']);
  }
}

function clearImpersonationAndRedirect(router: Router): void {
  localStorage.removeItem(IMPERSONATION_TOKEN_KEY);
  localStorage.removeItem(IMPERSONATION_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('openerp:impersonation-ended'));
  if (!router.url.startsWith('/platform/tenants')) {
    router.navigate(['/platform/tenants']);
  }
}

function requestRefresh(httpBackend: HttpBackend): Observable<string> {
  if (!refreshInFlight$) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    refreshInFlight$ = httpBackend
      .handle(
        new HttpRequest('POST', `${environment.apiBaseUrl}/api/v1/auth/refresh`, {
          refresh_token: refreshToken
        }, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        })
      )
      .pipe(
        map((event) => {
          const response = event as HttpResponse<RefreshEnvelope>;
          const accessToken = response.body?.data?.access_token;
          if (!accessToken) {
            throw { code: 'AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED' };
          }
          localStorage.setItem(TOKEN_KEY, accessToken);
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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const httpBackend = inject(HttpBackend);
  const router = inject(Router);

  const impersonationToken = localStorage.getItem(IMPERSONATION_TOKEN_KEY);
  const token = impersonationToken || localStorage.getItem(TOKEN_KEY);
  const sessionId = impersonationToken ? null : localStorage.getItem(SESSION_ID_KEY);

  // Public auth endpoints must never receive a stale access token / session header,
  // otherwise the backend security layer rejects the request before it reaches the endpoint.
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
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));

  let authReq = req;
  if (!isPublicAuthRequest && (token || sessionId)) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (sessionId) headers['X-Session-Id'] = sessionId;
    authReq = req.clone({ setHeaders: headers });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isAuthEndpoint = req.url.includes('/api/v1/auth/');
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (impersonationToken) {
        if (isUnauthorized) {
          clearImpersonationAndRedirect(router);
        }
        return throwError(() => error);
      }

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
        switchMap((newToken) =>
          next(authReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
        )
      );
    })
  );
};
