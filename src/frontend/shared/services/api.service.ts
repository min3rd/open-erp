import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiErrorResponse, ApiResponse } from '../models';

/**
 * Base URL for core/plugin API calls. Core provides the environment URL;
 * embedded plugins provide an empty string because the core gateway already
 * routes `/api/...`.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => ''
});

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  postForm<T>(path: string, form: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, form).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  delete<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    const options = body !== undefined ? { body } : {};
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, options).pipe(catchError(this.handleError));
  }

  private handleError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.error && typeof error.error === 'object' && (error.error as ApiErrorResponse).code) {
        return throwError(() => error.error as ApiErrorResponse);
      }
      const codeByStatus: Record<number, string> = {
        0: 'NETWORK_ERROR',
        400: 'VALIDATION_FAILED',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        423: 'AUTH_ACCOUNT_LOCKED',
        429: 'TOO_MANY_REQUESTS'
      };
      const code = codeByStatus[error.status] ?? 'INTERNAL_SERVER_ERROR';
      return throwError(() => ({ code, message: error.message } as ApiErrorResponse));
    }
    return throwError(() => error);
  }
}
