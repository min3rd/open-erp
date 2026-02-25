import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_URI_AUTH } from '../constant';
import { ApiResponse, ApiSingleResponse, ApiResponseError, isApiResponse, unwrap } from '../api';

export interface MeProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string | null;
  status: string;
  verifiedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  address?: {
    country?: string;
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  dateOfBirth?: string;
  skills?: string[];
  hobbies?: string[];
  roles?: { id: string; code: string; name: string; description?: string }[];
  permissions?: string[];
}

export interface MeSettings {
  dateFormat: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  layoutDensity: 'compact' | 'comfortable';
  notificationsInApp: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
}

export interface MeSession {
  id: string;
  deviceInfo: string;
  ipAddress?: string | null;
  createdAt?: string;
  expiresAt: string;
}

export interface UpdateMeDto {
  fullName?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  address?: {
    country?: string;
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  dateOfBirth?: string;
  skills?: string[];
  hobbies?: string[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class MeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_AUTH}/v1`;

  getProfile(): Observable<MeProfile> {
    return this.http
      .get<ApiSingleResponse<MeProfile>>(`${this.baseUrl}/me`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item as MeProfile;
          }
          return response as unknown as MeProfile;
        }),
        catchError(this.handleError),
      );
  }

  updateProfile(data: UpdateMeDto): Observable<MeProfile> {
    return this.http
      .patch<ApiSingleResponse<MeProfile>>(`${this.baseUrl}/me`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const result = unwrap(response);
            return result.item as MeProfile;
          }
          return response as unknown as MeProfile;
        }),
        catchError(this.handleError),
      );
  }

  changePassword(payload: ChangePasswordDto): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message: string }>>(
        `${this.baseUrl}/me/change-password`,
        payload,
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as { success: boolean; message: string };
          }
          return response as unknown as { success: boolean; message: string };
        }),
        catchError(this.handleError),
      );
  }

  getSessions(): Observable<MeSession[]> {
    return this.http
      .get<ApiResponse<MeSession[]>>(`${this.baseUrl}/me/sessions`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as MeSession[];
          }
          return response as unknown as MeSession[];
        }),
        catchError(this.handleError),
      );
  }

  revokeSession(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<ApiResponse<{ success: boolean; message: string }>>(
        `${this.baseUrl}/me/sessions/${sessionId}`,
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as { success: boolean; message: string };
          }
          return response as unknown as { success: boolean; message: string };
        }),
        catchError(this.handleError),
      );
  }

  getSettings(): Observable<MeSettings> {
    return this.http
      .get<ApiResponse<MeSettings>>(`${this.baseUrl}/me/settings`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as MeSettings;
          }
          return response as unknown as MeSettings;
        }),
        catchError(this.handleError),
      );
  }

  updateSettings(settings: Partial<MeSettings>): Observable<MeSettings> {
    return this.http
      .patch<ApiResponse<MeSettings>>(`${this.baseUrl}/me/settings`, settings)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as MeSettings;
          }
          return response as unknown as MeSettings;
        }),
        catchError(this.handleError),
      );
  }

  deleteAccount(password: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message: string }>>(
        `${this.baseUrl}/me/delete-account`,
        { password },
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response) as { success: boolean; message: string };
          }
          return response as unknown as { success: boolean; message: string };
        }),
        catchError(this.handleError),
      );
  }

  private handleError(error: HttpErrorResponse | ApiResponseError): Observable<never> {
    if (error instanceof ApiResponseError) {
      return throwError(() => error);
    }
    if (error instanceof HttpErrorResponse) {
      const msg =
        error.error?.message ||
        error.error?.error?.message ||
        `Server error: ${error.status}`;
      return throwError(() => new Error(msg));
    }
    return throwError(() => new Error('An unexpected error occurred'));
  }
}
