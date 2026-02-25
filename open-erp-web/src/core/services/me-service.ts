import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_URI_AUTH } from '../constant';
import { ApiResponse, ApiSingleResponse, ApiResponseError, isApiResponse, unwrap } from '../api';
// Re-export types from canonical types file for backward compatibility
export type {
  MeProfile,
  MeAvatar,
  MeAddress,
  MeRole,
  MeSettings,
  MeSession,
  UpdateMeDto,
  ChangePasswordDto,
} from '../../app/private/me/me.types';
import type {
  MeProfile,
  MeSettings,
  MeSession,
  UpdateMeDto,
  ChangePasswordDto,
} from '../../app/private/me/me.types';

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
