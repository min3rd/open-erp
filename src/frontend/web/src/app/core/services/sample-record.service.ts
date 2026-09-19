import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  PagedData,
  ResponseKey,
  SampleRecord,
  SampleRecordExportData
} from '@shared';

export interface SampleRecordQuery {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

export interface SampleRecordPayload {
  title: string;
  amount: number;
  status: string;
  branch_id?: string | null;
  department_id?: string | null;
  assignee_id?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SampleRecordService {
  private api = inject(ApiService);

  getSampleRecords(query: SampleRecordQuery): Observable<ApiResponse<PagedData<SampleRecord>>> {
    return this.api.get<PagedData<SampleRecord>>(`/api/v1/core/sample-records${buildQuery(query as Record<string, any>)}`);
  }

  createSampleRecord(payload: SampleRecordPayload): Observable<ApiResponse<SampleRecord>> {
    return this.api.post<SampleRecord>('/api/v1/core/sample-records', {
      [ResponseKey.TITLE]: payload.title,
      [ResponseKey.AMOUNT]: payload.amount,
      [ResponseKey.STATUS]: payload.status,
      [ResponseKey.BRANCH_ID]: payload.branch_id || null,
      [ResponseKey.DEPARTMENT_ID]: payload.department_id || null,
      [ResponseKey.ASSIGNEE_ID]: payload.assignee_id || null
    });
  }

  updateSampleRecord(recordId: string, payload: SampleRecordPayload): Observable<ApiResponse<SampleRecord>> {
    return this.api.put<SampleRecord>(`/api/v1/core/sample-records/${recordId}`, {
      [ResponseKey.TITLE]: payload.title,
      [ResponseKey.AMOUNT]: payload.amount,
      [ResponseKey.STATUS]: payload.status,
      [ResponseKey.BRANCH_ID]: payload.branch_id || null,
      [ResponseKey.DEPARTMENT_ID]: payload.department_id || null,
      [ResponseKey.ASSIGNEE_ID]: payload.assignee_id || null
    });
  }

  deleteSampleRecord(recordId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/core/sample-records/${recordId}`);
  }

  exportSampleRecords(): Observable<ApiResponse<SampleRecordExportData>> {
    return this.api.post<SampleRecordExportData>('/api/v1/core/sample-records/export', {});
  }
}
