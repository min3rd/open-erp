import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading-service';
import { catchError, finalize } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.append(req.url);
  return next(req).pipe(
    catchError((e) => {
      throw e;
    }),
    finalize(() => loadingService.remove(req.url))
  );
};
