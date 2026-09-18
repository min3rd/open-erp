import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { ApiResponse, ApiErrorResponse } from '@shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = localStorage.getItem('openerp_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const sessionId = localStorage.getItem('openerp_session_id');
    if (sessionId) {
      headers = headers.set('X-Session-Id', sessionId);
    }
    return headers;
  }

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
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
