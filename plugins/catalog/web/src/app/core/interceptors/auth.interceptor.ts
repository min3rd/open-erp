import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('openerp_token');
  const sessionId = localStorage.getItem('openerp_session_id');
  if (!token && !sessionId) {
    return next(req);
  }
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['X-Session-Id'] = sessionId;
  return next(req.clone({ setHeaders: headers }));
};
