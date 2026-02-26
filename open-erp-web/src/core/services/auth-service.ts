import { HttpClient } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { API_URI_AUTH } from '../constant';
import { BehaviorSubject, from, map, Observable, of, switchMap, catchError, throwError } from 'rxjs';
import { UserDto } from '../interfaces/user.types';
import { ApiResponse, ApiSingleResponse } from '../api';

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  needs2fa?: boolean;
  tempAuthToken?: string;
}

export interface TwoFAVerifyDto {
  tempAuthToken: string;
  otp: string;
}

export interface TwoFARecoveryDisableDto {
  tempAuthToken: string;
  recoveryCode: string;
}

export interface TwoFALoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly ENCRYPTION_KEY_NAME = 'erp_enc_key';
  private readonly ACCESS_TOKEN_KEY = 'erp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'erp_refresh_token';

  private _user: BehaviorSubject<UserDto | null> = new BehaviorSubject<any>(null);
  private _accessToken!: string | undefined;
  private _refreshToken!: string | undefined;

  get user$(): Observable<UserDto | null> {
    return this._user.asObservable();
  }

  get accessToken(): string | undefined {
    return this._accessToken;
  }

  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  constructor() {
    this.getStoredTokens();
  }

  register(form: RegisterDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/register`, form);
  }

  verifyEmail(payload: VerifyEmailDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/verify-email`, payload);
  }

  resendVerificationCode(email: string, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/resend-verification`, { email });
  }

  login(payload: LoginDto, version: string = 'v1') {
    return this.httpClient.post<ApiResponse<LoginResponse>>(
      `${API_URI_AUTH}/${version}/auth/login`,
      payload,
    );
  }

  forgotPassword(payload: ForgotPasswordDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/reset-password`, payload);
  }

  verify2FA(payload: TwoFAVerifyDto, version: string = 'v1') {
    return this.httpClient.post<ApiResponse<TwoFALoginResponse>>(
      `${API_URI_AUTH}/${version}/auth/2fa/verify`,
      payload,
    );
  }

  disableWith2FARecovery(payload: TwoFARecoveryDisableDto, version: string = 'v1') {
    return this.httpClient.post<ApiResponse<TwoFALoginResponse>>(
      `${API_URI_AUTH}/${version}/auth/2fa/recovery/disable`,
      payload,
    );
  }

  me(version: string = 'v1'): Observable<ApiSingleResponse<UserDto>> {
    return this.httpClient.get<ApiSingleResponse<UserDto>>(`${API_URI_AUTH}/${version}/me`).pipe(
      map((response: ApiSingleResponse<UserDto>) => {
        this._user.next(response.data?.item || null);
        return response;
      }),
    );
  }

  logOut(): Observable<boolean> {
    const refreshToken = this._refreshToken;

    // Call backend to revoke server-side session, then clear local state
    const clearLocal = () => {
      this.clearStoredTokens();
      this._accessToken = undefined;
      this._refreshToken = undefined;
      this._user.next(null);
    };

    if (refreshToken && this._accessToken) {
      return this.httpClient.post(`${API_URI_AUTH}/v1/auth/logout`, { refreshToken }).pipe(
        map(() => {
          clearLocal();
          return true;
        }),
        catchError(() => {
          // Clear local tokens even if server call fails
          clearLocal();
          return of(true);
        }),
      );
    }

    // No tokens to revoke on server, just clear locally
    clearLocal();
    return of(true);
  }

  /**
   * Calls the refresh token endpoint and updates in-memory and stored tokens.
   * Returns the new access token on success, or throws on failure.
   */
  refreshAccessToken(version: string = 'v1'): Observable<string> {
    return this.httpClient
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_URI_AUTH}/${version}/auth/refresh`,
        { refreshToken: this._refreshToken },
      )
      .pipe(
        switchMap((response) => {
          const data = response?.data;
          if (!data?.accessToken) {
            return throwError(() => new Error('Invalid refresh response'));
          }
          const newAccessToken = data.accessToken;
          const newRefreshToken = data.refreshToken ?? this._refreshToken!;
          this._accessToken = newAccessToken;
          this._refreshToken = newRefreshToken;
          return from(
            this.encryptAndStoreTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }),
          ).pipe(map(() => newAccessToken));
        }),
      );
  }

  /**
   * Encrypts and stores tokens in localStorage using Web Crypto API.
   *
   * Security Note: Client-side encryption provides protection against casual inspection
   * but is not secure against determined attackers who have access to the client environment.
   * The encryption key is stored in localStorage, which means anyone with access to the
   * browser's storage can decrypt the tokens.
   *
   * For production environments, consider:
   * - Using secure HTTP-only cookies for token storage (recommended)
   * - Implementing server-side session management
   * - Using short-lived access tokens with refresh token rotation
   *
   * @param tokens - The access and refresh tokens to encrypt and store
   */
  async encryptAndStoreTokens(tokens: TokenPayload): Promise<void> {
    this._accessToken = tokens.accessToken;
    this._refreshToken = tokens.refreshToken;

    try {
      // In dev mode we store tokens plaintext to simplify debugging.
      if (isDevMode()) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
        return;
      }

      const key = await this.getOrCreateEncryptionKey();

      const encryptedAccessToken = await this.encryptData(tokens.accessToken, key);
      const encryptedRefreshToken = await this.encryptData(tokens.refreshToken, key);

      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
    } catch (error) {
      console.error('Failed to encrypt and store tokens:', error);
      throw error;
    }
  }

  /**
   * Retrieves and decrypts tokens from localStorage.
   * Returns null if tokens are not found or decryption fails.
   */
  async getStoredTokens(): Promise<TokenPayload | null> {
    try {
      // In dev mode tokens are stored plaintext for easier debugging.
      if (isDevMode()) {
        const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

        if (!accessToken || !refreshToken) {
          return null;
        }
        this._accessToken = accessToken;
        this._refreshToken = refreshToken;
        return { accessToken, refreshToken };
      }

      const encryptedAccessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const encryptedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

      if (!encryptedAccessToken || !encryptedRefreshToken) {
        return null;
      }

      const key = await this.getOrCreateEncryptionKey();

      const accessToken = await this.decryptData(encryptedAccessToken, key);
      const refreshToken = await this.decryptData(encryptedRefreshToken, key);
      this._accessToken = accessToken;
      this._refreshToken = refreshToken;
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Failed to retrieve and decrypt tokens:', error);
      return null;
    }
  }

  /**
   * Clears all stored tokens from localStorage
   */
  clearStoredTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): Observable<boolean> {
    return from(this.getStoredTokens()).pipe(
      switchMap((payload: TokenPayload | null) => {
        if (!payload || !payload.accessToken || !payload.refreshToken) {
          return of(false);
        }
        const isAccessTokenValid = !this.isExpired(payload.accessToken);
        const isRefreshTokenValid = !this.isExpired(payload.refreshToken);
        return of(isAccessTokenValid || isRefreshTokenValid);
      }),
    );
  }

  isExpired(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        return true;
      }

      const parts = token.split('.');
      if (parts.length < 2) {
        return true;
      }

      // Convert base64url to base64
      const payloadBase64Url = parts[1];
      const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

      // atob works on base64; handle UTF-8 payloads safely
      const binary = atob(padded);
      const payloadJson = decodeURIComponent(
        binary
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );

      const payload = JSON.parse(payloadJson);

      const currentTime = Math.floor(Date.now() / 1000);

      if (typeof payload.exp !== 'number') {
        return true;
      }

      return payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  }

  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(this.ENCRYPTION_KEY_NAME);

    if (storedKey) {
      const keyData = JSON.parse(storedKey);
      return await crypto.subtle.importKey('jwk', keyData, { name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
      ]);
    }

    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);

    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(this.ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

    return key;
  }

  private async encryptData(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private async decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

    return new TextDecoder().decode(decryptedData);
  }
}
