import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_DATA_TRANSFER } from '../../constant';
import { ApiResponse } from '../../api/interfaces';
import { unwrap } from '../../api/http-wrapper';
import {
  EntityTemplate,
  ImportExportJob,
  MappingTemplate,
  CreateExportJobDto,
  CreateImportJobDto,
  SaveMappingTemplateDto,
} from './import-export.types';

export type {
  EntityTemplate,
  EntityField,
  ImportExportJob,
  MappingTemplate,
  JobError,
  CreateExportJobDto,
  CreateImportJobDto,
  SaveMappingTemplateDto,
  JobType,
  JobStatus,
  ExportFormat,
  ExportMode,
  ImportMode,
} from './import-export.types';

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_DATA_TRANSFER}/v1/import-export`;

  getTemplates(): Observable<EntityTemplate[]> {
    return this.http
      .get<ApiResponse<EntityTemplate[]>>(`${this.baseUrl}/templates`)
      .pipe(map(unwrap));
  }

  getTemplate(entity: string): Observable<EntityTemplate> {
    return this.http
      .get<ApiResponse<EntityTemplate>>(`${this.baseUrl}/templates/${entity}`)
      .pipe(map(unwrap));
  }

  getJobs(page = 1, limit = 20): Observable<{ items: ImportExportJob[]; total: number; page: number; limit: number }> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<any>(`${this.baseUrl}/jobs`, { params })
      .pipe(map((r) => r.data));
  }

  getJob(jobId: string): Observable<ImportExportJob> {
    return this.http
      .get<ApiResponse<ImportExportJob>>(`${this.baseUrl}/jobs/${jobId}`)
      .pipe(map(unwrap));
  }

  createExportJob(dto: CreateExportJobDto): Observable<ImportExportJob> {
    return this.http
      .post<any>(`${this.baseUrl}/export`, dto)
      .pipe(map((r) => r.data?.item));
  }

  getExportStatus(jobId: string): Observable<{ id: string; status: string; progress: number }> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/export/${jobId}/status`)
      .pipe(map(unwrap));
  }

  downloadExport(jobId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${jobId}/download`, { responseType: 'blob' });
  }

  createImportJob(dto: CreateImportJobDto, file: File): Observable<ImportExportJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', dto.entity);
    if (dto.importMode) formData.append('importMode', dto.importMode);
    if (dto.mapping) formData.append('mapping', JSON.stringify(dto.mapping));
    if (dto.orgId) formData.append('orgId', dto.orgId);
    if (dto.dryRun !== undefined) formData.append('dryRun', String(dto.dryRun));

    return this.http
      .post<any>(`${this.baseUrl}/import`, formData)
      .pipe(map((r) => r.data?.item));
  }

  getImportStatus(jobId: string): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/import/${jobId}/status`)
      .pipe(map(unwrap));
  }

  downloadErrors(jobId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/import/${jobId}/errors/download`, {
      responseType: 'blob',
    });
  }

  getMappings(entity: string): Observable<MappingTemplate[]> {
    const params = new HttpParams().set('entity', entity);
    return this.http
      .get<ApiResponse<MappingTemplate[]>>(`${this.baseUrl}/mappings`, { params })
      .pipe(map(unwrap));
  }

  saveMapping(dto: SaveMappingTemplateDto): Observable<MappingTemplate> {
    return this.http
      .post<any>(`${this.baseUrl}/mappings`, dto)
      .pipe(map((r) => r.data?.item));
  }

  deleteMapping(id: string): Observable<void> {
    return this.http.delete<any>(`${this.baseUrl}/mappings/${id}`).pipe(map(() => undefined));
  }
}
