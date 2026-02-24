import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_URI_USER } from '../constant';
import { ApiPaginatedResponse, ApiResponse, unwrap, isApiResponse, ApiResponseError } from '../api';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'blocked';
  lastLogin?: string;
  createdAt: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: 'global' | 'organization';
  organizationId?: string;
  sortField?: string;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  /**
   * Get users list with pagination and filtering
   * Calls the real backend API with new standardized envelope structure
   */
  getUsers(params: GetUsersParams): Observable<UserListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope === 'organization' && params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    if (params.sortField) {
      httpParams = httpParams.set('sort', params.sortField);
      if (params.sortOrder) {
        httpParams = httpParams.set('order', params.sortOrder === -1 ? 'desc' : 'asc');
      }
    }

    return this.http
      .get<ApiPaginatedResponse<User> | UserListResponse>(`${API_URI_USER}/v1/users`, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiPaginatedResponse<User>);
            // Transform from ApiPaginatedData to UserListResponse
            return {
              data: data.items,
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            };
          }
          // Legacy format - return as-is
          console.warn(
            'UserService: Received legacy response format. Migration to API envelope pending.',
          );
          return response as UserListResponse;
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Bulk action: Block selected users
   */
  blockUsers(userIds: string[]): Observable<void> {
    return this.http
      .post<ApiResponse<void> | void>(`${API_URI_USER}/v1/users/block`, { userIds })
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            // unwrap will throw ApiResponseError if response.success is false
            // This is the intended error handling behavior
            unwrap(response as ApiResponse<void>);
            return;
          }
          // Legacy format - return as-is
          return response as void;
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Bulk action: Revoke login sessions for selected users
   */
  revokeLoginSessions(userIds: string[]): Observable<void> {
    return this.http
      .post<ApiResponse<void> | void>(`${API_URI_USER}/v1/users/revoke-sessions`, { userIds })
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            // unwrap will throw ApiResponseError if response.success is false
            // This is the intended error handling behavior
            unwrap(response as ApiResponse<void>);
            return;
          }
          // Legacy format - return as-is
          return response as void;
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Export users to CSV
   */
  exportToCSV(params: GetUsersParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope === 'organization' && params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http
      .post(`${API_URI_USER}/v1/users/export`, params, {
        params: httpParams,
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse | ApiResponseError): Observable<never> {
    let errorMessage = 'An error occurred';

    // Handle ApiResponseError from unwrap
    if (error instanceof ApiResponseError) {
      errorMessage = error.message;
      console.error('UserService API error:', errorMessage, error);
      return throwError(() => error);
    }

    // Handle HTTP errors
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else {
        // Check if error response has API envelope
        if (isApiResponse(error.error)) {
          try {
            unwrap(error.error);
          } catch (apiError) {
            if (apiError instanceof ApiResponseError) {
              return throwError(() => apiError);
            }
          }
        }

        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Forbidden. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Server error: ${error.status} - ${error.message}`;
        }
      }
    }

    console.error('UserService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
