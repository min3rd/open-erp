import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface OfficeDocumentMeta {
  id: string;
  title: string;
  original_filename: string;
  file_extension: string;
  doc_type: string;
  mime_type: string;
  size_bytes: number;
  current_version: number;
  status: string;
  updated_at?: string;
}

export interface OfficeDocumentPermission {
  id: string;
  document_id: string;
  subject_type: string;
  subject_id: string;
  permission: string;
  created_at?: string;
}

interface Envelope<T> {
  success: boolean;
  code: string;
  data: T;
}

interface ListData<T> {
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class OfficeStorageService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/office/documents';

  list(): Observable<OfficeDocumentMeta[]> {
    return this.http.get<Envelope<ListData<OfficeDocumentMeta>>>(this.base)
      .pipe(map((response) => response.data?.items ?? []));
  }

  get(id: string): Observable<OfficeDocumentMeta> {
    return this.http.get<Envelope<OfficeDocumentMeta>>(`${this.base}/${id}`)
      .pipe(map((response) => response.data));
  }

  content(id: string, version?: number): Observable<ArrayBuffer> {
    let params = new HttpParams();
    if (version) params = params.set('version', version);
    return this.http.get(this.base + '/' + id + '/content', {
      params,
      responseType: 'arraybuffer',
    });
  }

  create(meta: Partial<OfficeDocumentMeta>): Observable<OfficeDocumentMeta> {
    return this.http.post<Envelope<OfficeDocumentMeta>>(this.base, meta)
      .pipe(map((response) => response.data));
  }

  saveContent(id: string, bytes: Uint8Array, fileName: string, expectedVersion: number): Observable<OfficeDocumentMeta> {
    const form = new FormData();
    form.append('file', new Blob([bytes as BlobPart]), fileName);
    form.append('expected_version', String(expectedVersion));
    return this.http.put<Envelope<OfficeDocumentMeta>>(this.base + '/' + id + '/content', form)
      .pipe(map((response) => response.data));
  }

  permissions(id: string): Observable<OfficeDocumentPermission[]> {
    return this.http.get<Envelope<ListData<OfficeDocumentPermission>>>(this.base + '/' + id + '/permissions')
      .pipe(map((response) => response.data?.items ?? []));
  }

  share(id: string, subjectId: string, permission: string): Observable<OfficeDocumentPermission> {
    return this.http.post<Envelope<OfficeDocumentPermission>>(this.base + '/' + id + '/permissions', {
      subject_type: 'USER',
      subject_id: subjectId,
      permission,
    }).pipe(map((response) => response.data));
  }

  revoke(id: string, permissionId: string): Observable<{ id: string; revoked: boolean }> {
    return this.http.delete<Envelope<{ id: string; revoked: boolean }>>(
      this.base + '/' + id + '/permissions/' + permissionId)
      .pipe(map((response) => response.data));
  }
}
