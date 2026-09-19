import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { ApiResponse, ApiErrorResponse } from '@shared';
import { environment } from '../../environments/environment';
import { STORAGE_KEY_PLATFORM_TOKEN, STORAGE_KEY_SESSION_ID, STORAGE_KEY_TENANT_TOKEN } from './storage-keys';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private getHeaders(path: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const platformRoute = path.startsWith('/api/v1/platform/');
    const token = platformRoute
      ? localStorage.getItem(STORAGE_KEY_PLATFORM_TOKEN) ?? localStorage.getItem(STORAGE_KEY_TENANT_TOKEN)
      : localStorage.getItem(STORAGE_KEY_TENANT_TOKEN);
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const sessionId = localStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (sessionId && !platformRoute) {
      headers = headers.set('X-Session-Id', sessionId);
    }
    return headers;
  }

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(path)
    }).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders(path)
    }).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders(path)
    }).pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(path)
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errRes: ApiErrorResponse = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message
    };
    if (error.error && error.error.code) {
      errRes = error.error;
    }
    return throwError(() => errRes);
  }
}
