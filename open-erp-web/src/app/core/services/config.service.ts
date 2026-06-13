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
}
