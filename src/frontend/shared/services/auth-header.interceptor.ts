import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'openerp_token';
const REFRESH_TOKEN_KEY = 'openerp_refresh_token';
const SESSION_ID_KEY = 'openerp_session_id';
const USER_KEY = 'openerp_user';

/**
 * Attaches the caller credentials for standalone plugin UIs.
 * If a 401 UNAUTHORIZED response is returned (e.g. JWT expired after 15m),
 * clears the session, dispatches 'openerp:session-expired' and redirects to login (BUG-179).
 */
export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const sessionId = localStorage.getItem(SESSION_ID_KEY);

  let authReq = req;
  if (token || sessionId) {
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
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const isPublic = req.url.includes('/api/v1/public/') || req.url.includes('/api/v1/auth/');
        if (!isPublic && typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(SESSION_ID_KEY);
          localStorage.removeItem(USER_KEY);
          window.dispatchEvent(new CustomEvent('openerp:session-expired'));
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/login') && !currentPath.startsWith('/public')) {
            const returnUrl = encodeURIComponent(currentPath + window.location.search);
            window.location.href = `/login?expired=true&returnUrl=${returnUrl}`;
          }
        }
      }
      return throwError(() => error);
    })
  );
};
