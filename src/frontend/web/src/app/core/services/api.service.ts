import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { ApiResponse, ApiErrorResponse } from '@shared';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
  }

  delete<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    const options = body !== undefined ? { body } : {};
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, options).pipe(catchError(this.handleError));
  }

  private handleError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      // Prefer the standardized backend envelope { success, code, message, params }.
      if (error.error && typeof error.error === 'object' && (error.error as ApiErrorResponse).code) {
        return throwError(() => error.error as ApiErrorResponse);
      }

      // Fallback for empty/non-JSON responses (e.g. security-layer 401): map by HTTP status
      // so the UI never shows a misleading INTERNAL_SERVER_ERROR for a 4xx.
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
      const code = codeByStatus[error.status] ?? (error.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'INTERNAL_SERVER_ERROR');
      return throwError(() => ({
        code,
        message: error.message
      } as ApiErrorResponse));
    }
    return throwError(() => error);
  }
}
