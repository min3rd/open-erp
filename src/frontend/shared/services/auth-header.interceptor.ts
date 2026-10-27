import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'openerp_token';
const SESSION_ID_KEY = 'openerp_session_id';

/**
 * Attaches the caller credentials for standalone plugin UIs. Core web keeps its
 * richer interceptor (refresh/redirect); embedded plugins only need the header.
 */
export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!token && !sessionId) {
    return next(req);
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  return next(req.clone({ setHeaders: headers }));
};
