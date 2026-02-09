import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_FILE } from '../constant';
import { ApiSingleResponse } from '../api/interfaces';

/**
 * OnlyOffice session config returned by the backend
 */
export interface OnlyOfficeSessionConfig {
  editorUrl: string;
  config: Record<string, any>;
  documentKey: string;
}

/**
 * File service - handles calls to the file-service backend (port 3008)
 * Backend: apps/file-service/src/
 */
@Injectable({
  providedIn: 'root',
})
export class FileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_FILE}/v1`;

  /**
   * Create an OnlyOffice editing/viewing session
   * POST /onlyoffice/session
   */
  createOnlyOfficeSession(
    params: {
      fileId?: string;
      minioKey?: string;
      filename?: string;
      mode?: 'view' | 'edit';
    }
  ): Observable<OnlyOfficeSessionConfig> {
    return this.http
      .post<ApiSingleResponse<OnlyOfficeSessionConfig>>(
        `${this.baseUrl}/onlyoffice/session`,
        params
      )
      .pipe(
        map((response) => {
          if (!response.data?.item) {
            throw new Error('Failed to create OnlyOffice session');
          }
          return response.data.item;
        })
      );
  }
}
