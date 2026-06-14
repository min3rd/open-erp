import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private http = inject(HttpClient);
  private config: any = null;

  loadConfig(): Promise<void> {
    return firstValueFrom(
      this.http.get('/assets/config.json')
    )
      .then((data) => {
        this.config = data;
      })
      .catch((err) => {
        console.error('Không thể tải file config.json, sử dụng fallback', err);
        this.config = { apiUrl: 'http://localhost:3000' };
      });
  }

  get apiUrl(): string {
    return this.config?.apiUrl || 'http://localhost:3000';
  }

  buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.apiUrl}${endpoint}`;
    if (params) {
      const remainingParams = { ...params };
      // Replace path parameters (e.g. :id)
      Object.entries(remainingParams).forEach(([key, value]) => {
        const placeholder = `:${key}`;
        if (url.includes(placeholder)) {
          url = url.replace(placeholder, encodeURIComponent(String(value)));
          delete remainingParams[key];
        }
      });

      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(remainingParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return url;
  }
}
