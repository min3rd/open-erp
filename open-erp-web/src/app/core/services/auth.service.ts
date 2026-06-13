import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { RegisterPayload, RegisterResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  checkSubdomain(subdomain: string): Observable<boolean> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.checkSubdomain, { subdomain });
    return this.http.get<{ success: boolean; data: { available: boolean } }>(url).pipe(
      map((res) => res.success && res.data.available)
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.register);
    return this.http.post<RegisterResponse>(url, payload);
  }
}
