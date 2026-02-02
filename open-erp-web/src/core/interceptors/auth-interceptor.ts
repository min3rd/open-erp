import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let newReq = req.clone();

  if (authService.accessToken && !authService.isExpired(authService.accessToken)) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authService.accessToken}`),
    });
  }

  return next(newReq).pipe(
    catchError((error) => {
      // Catch "401 Unauthorized" responses
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Sign out
        authService.logOut();

        // Reload the app
        location.reload();
      }
      return throwError(error);
    })
  );
};
