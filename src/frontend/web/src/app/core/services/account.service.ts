import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  UserProfileData,
  TwoFactorStatus,
  TwoFactorSetupData,
  TwoFactorEnableData,
  BackupCodesData,
  SessionsData
} from '@shared';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private api = inject(ApiService);

  getProfile(): Observable<ApiResponse<UserProfileData>> {
    return this.api.get<UserProfileData>('/api/v1/account/profile');
  }

  updateProfile(data: Partial<UserProfileData>): Observable<ApiResponse<UserProfileData>> {
    return this.api.put<UserProfileData>('/api/v1/account/profile', data);
  }

  changePassword(data: { current_password: string; new_password: string; logout_other_devices: boolean }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/account/change-password', data);
  }

  get2FaStatus(): Observable<ApiResponse<TwoFactorStatus>> {
    return this.api.get<TwoFactorStatus>('/api/v1/account/2fa/status');
  }

  setup2Fa(): Observable<ApiResponse<TwoFactorSetupData>> {
    return this.api.post<TwoFactorSetupData>('/api/v1/account/2fa/setup', {});
  }

  enable2Fa(code: string): Observable<ApiResponse<TwoFactorEnableData>> {
    return this.api.post<TwoFactorEnableData>('/api/v1/account/2fa/enable', { code });
  }

  disable2Fa(currentPassword: string, code: string): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/account/2fa/disable', {
      current_password: currentPassword,
      code
    });
  }

  regenerateBackupCodes(currentPassword: string): Observable<ApiResponse<BackupCodesData>> {
    return this.api.post<BackupCodesData>('/api/v1/account/2fa/regenerate-backup-codes', {
      current_password: currentPassword
    });
  }

  getSessions(): Observable<ApiResponse<SessionsData>> {
    return this.api.get<SessionsData>('/api/v1/account/sessions');
  }

  revokeSession(sessionId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`/api/v1/account/sessions/${sessionId}`);
  }

  revokeOtherSessions(): Observable<ApiResponse<any>> {
    return this.api.delete('/api/v1/account/sessions/other');
  }
}
