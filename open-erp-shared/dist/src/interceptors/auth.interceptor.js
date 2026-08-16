import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
export const sharedAuthInterceptor = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.accessToken();
    if (req.url.startsWith('/i18n/') || req.url.includes('/config/') || req.url.includes('/auth/login') || req.url.includes('/auth/public-key')) {
        return next(req);
    }
    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }
    return next(req);
};
//# sourceMappingURL=auth.interceptor.js.map