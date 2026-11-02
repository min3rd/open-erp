import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, ApiService, ListData, PagedData } from '@shared';
import {
  ApprovalConfig,
  Assignment,
  AssignmentWriteRequest,
  BranchOption,
  Campaign,
  ChangeRequest,
  Contract,
  ContractWriteRequest,
  DepartmentOption,
  DirectoryEntry,
  EmployeeDetail,
  EmployeeDocument,
  EmployeeSummary,
  EmployeeWriteRequest,
  FieldConfig,
  ImportResult,
  OnboardingInvite,
  OrgChartNode,
  PrivacyRequest,
  SignedUrlResponse,
} from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private staticBase = inject(API_BASE_URL);
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/employee');
    return `${prefix}${path}`;
  }

  private orgUrl(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/org-structure');
    return `${prefix}${path}`;
  }

  list(q = '', status = '', type = '', page = 0, size = 10): Observable<ApiResponse<PagedData<EmployeeSummary>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (type) params.set('employee_type', type);
    return this.api.get<PagedData<EmployeeSummary>>(this.url(`/api/v1/employee/employees?${params}`));
  }

  get(id: string): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.get<EmployeeDetail>(this.url(`/api/v1/employee/employees/${id}`));
  }

  create(payload: EmployeeWriteRequest): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.post<EmployeeDetail>(this.url('/api/v1/employee/employees'), payload);
  }

  update(id: string, payload: EmployeeWriteRequest): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.put<EmployeeDetail>(this.url(`/api/v1/employee/employees/${id}`), payload);
  }

  offboard(id: string, payload: { exit_date?: string; exit_reason?: string }): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.post<EmployeeDetail>(this.url(`/api/v1/employee/employees/${id}/offboard`), payload);
  }

  me(): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.get<EmployeeDetail>(this.url('/api/v1/employee/me'));
  }

  updateMe(payload: Record<string, unknown>): Observable<ApiResponse<EmployeeDetail>> {
    return this.api.patch<EmployeeDetail>(this.url('/api/v1/employee/me'), payload);
  }

  myChangeRequests(): Observable<ApiResponse<ListData<ChangeRequest>>> {
    return this.api.get<ListData<ChangeRequest>>(this.url('/api/v1/employee/me/change-requests'));
  }

  submitMyChange(changes: Record<string, unknown>): Observable<ApiResponse<ChangeRequest>> {
    return this.api.post<ChangeRequest>(this.url('/api/v1/employee/me/change-requests'), { changes });
  }

  withdrawMyChange(id: string): Observable<ApiResponse<ChangeRequest>> {
    return this.api.post<ChangeRequest>(this.url(`/api/v1/employee/me/change-requests/${id}/withdraw`), {});
  }

  changeRequests(status = '', page = 0, size = 10): Observable<ApiResponse<PagedData<ChangeRequest>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return this.api.get<PagedData<ChangeRequest>>(this.url(`/api/v1/employee/change-requests?${params}`));
  }

  changeRequest(id: string): Observable<ApiResponse<ChangeRequest>> {
    return this.api.get<ChangeRequest>(this.url(`/api/v1/employee/change-requests/${id}`));
  }

  approve(id: string): Observable<ApiResponse<ChangeRequest>> {
    return this.api.post<ChangeRequest>(this.url(`/api/v1/employee/change-requests/${id}/approve`), {});
  }

  reject(id: string, reason: string): Observable<ApiResponse<ChangeRequest>> {
    return this.api.post<ChangeRequest>(this.url(`/api/v1/employee/change-requests/${id}/reject`), { reason });
  }

  fieldConfigs(): Observable<ApiResponse<ListData<FieldConfig>>> {
    return this.api.get<ListData<FieldConfig>>(this.url('/api/v1/employee/config/fields'));
  }

  updateFieldConfigs(items: FieldConfig[]): Observable<ApiResponse<ListData<FieldConfig>>> {
    return this.api.put<ListData<FieldConfig>>(this.url('/api/v1/employee/config/fields'), items);
  }

  bootstrapFieldConfigs(): Observable<ApiResponse<{ seeded: number; total: number }>> {
    return this.api.post<{ seeded: number; total: number }>(
      this.url('/api/v1/employee/config/fields/bootstrap'), {});
  }

  approvalConfigs(): Observable<ApiResponse<ListData<ApprovalConfig>>> {
    return this.api.get<ListData<ApprovalConfig>>(this.url('/api/v1/employee/config/approvals'));
  }

  updateApprovalConfigs(items: ApprovalConfig[]): Observable<ApiResponse<ListData<ApprovalConfig>>> {
    return this.api.put<ListData<ApprovalConfig>>(this.url('/api/v1/employee/config/approvals'), items);
  }

  deleteApprovalConfig(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(this.url(`/api/v1/employee/config/approvals/${id}`));
  }

  directory(q = ''): Observable<ApiResponse<ListData<DirectoryEntry>>> {
    const query = q ? `?q=${encodeURIComponent(q)}&size=200` : '?size=200';
    return this.api.get<ListData<DirectoryEntry>>(this.url(`/api/v1/employee/directory${query}`));
  }

  orgChart(): Observable<ApiResponse<ListData<OrgChartNode>>> {
    return this.api.get<ListData<OrgChartNode>>(this.url('/api/v1/employee/org-chart'));
  }

  exportEmployees(): Observable<Blob> {
    return this.http.get(this.url('/api/v1/employee/employees/export'), { responseType: 'blob' });
  }

  importEmployees(dryRun: boolean, rows: EmployeeWriteRequest[]): Observable<ApiResponse<ImportResult>> {
    return this.api.post<ImportResult>(this.url('/api/v1/employee/employees/import'),
      { dry_run: dryRun, rows });
  }

  onboardingInvites(page = 0, size = 10): Observable<ApiResponse<PagedData<OnboardingInvite>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.api.get<PagedData<OnboardingInvite>>(
      this.url(`/api/v1/employee/onboarding-invites?${params}`));
  }

  createOnboardingInvite(email: string, employeeId?: string): Observable<ApiResponse<OnboardingInvite>> {
    return this.api.post<OnboardingInvite>(this.url('/api/v1/employee/onboarding-invites'),
      { email, employee_id: employeeId });
  }

  revokeOnboardingInvite(id: string): Observable<ApiResponse<OnboardingInvite>> {
    return this.api.post<OnboardingInvite>(
      this.url(`/api/v1/employee/onboarding-invites/${id}/revoke`), {});
  }

  campaigns(page = 0, size = 10): Observable<ApiResponse<PagedData<Campaign>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.api.get<PagedData<Campaign>>(this.url(`/api/v1/employee/campaigns?${params}`));
  }

  createCampaign(name: string, status = 'ACTIVE'): Observable<ApiResponse<Campaign>> {
    return this.api.post<Campaign>(this.url('/api/v1/employee/campaigns'),
      { name, filter: { status: 'ACTIVE' }, status });
  }

  closeCampaign(id: string): Observable<ApiResponse<Campaign>> {
    return this.api.post<Campaign>(this.url(`/api/v1/employee/campaigns/${id}/close`), {});
  }

  privacyRequests(page = 0, size = 10): Observable<ApiResponse<PagedData<PrivacyRequest>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.api.get<PagedData<PrivacyRequest>>(this.url(`/api/v1/employee/privacy/requests?${params}`));
  }

  completePrivacyRequest(id: string): Observable<ApiResponse<PrivacyRequest>> {
    return this.api.post<PrivacyRequest>(this.url(`/api/v1/employee/privacy/requests/${id}/complete`), {});
  }

  exportPrivacyRequest(id: string): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.get<Record<string, unknown>>(this.url(`/api/v1/employee/privacy/requests/${id}/export`));
  }

  erasePrivacyRequest(id: string): Observable<ApiResponse<PrivacyRequest>> {
    return this.api.post<PrivacyRequest>(this.url(`/api/v1/employee/privacy/requests/${id}/erase`), {});
  }

  documents(employeeId: string): Observable<ApiResponse<ListData<EmployeeDocument>>> {
    return this.api.get<ListData<EmployeeDocument>>(
      this.url(`/api/v1/employee/employees/${employeeId}/documents`));
  }

  uploadDocument(employeeId: string, file: File, documentType: string,
                 retentionUntil?: string): Observable<ApiResponse<EmployeeDocument>> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('document_type', documentType);
    form.append('mime_type', file.type || 'application/octet-stream');
    if (retentionUntil) {
      form.append('retention_until', retentionUntil);
    }
    return this.api.postForm<EmployeeDocument>(
      this.url(`/api/v1/employee/employees/${employeeId}/documents`), form);
  }

  documentSignedUrl(documentId: string): Observable<ApiResponse<SignedUrlResponse>> {
    return this.api.post<SignedUrlResponse>(
      this.url(`/api/v1/employee/documents/${documentId}/signed-url`), {});
  }

  myDocuments(): Observable<ApiResponse<ListData<EmployeeDocument>>> {
    return this.api.get<ListData<EmployeeDocument>>(this.url('/api/v1/employee/me/documents'));
  }

  uploadMyDocument(file: File, documentType: string): Observable<ApiResponse<EmployeeDocument>> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('document_type', documentType);
    form.append('mime_type', file.type || 'application/octet-stream');
    return this.api.postForm<EmployeeDocument>(this.url('/api/v1/employee/me/documents'), form);
  }

  myDocumentSignedUrl(documentId: string): Observable<ApiResponse<SignedUrlResponse>> {
    return this.api.post<SignedUrlResponse>(
      this.url(`/api/v1/employee/me/documents/${documentId}/signed-url`), {});
  }

  /** Signed URLs are gateway-relative paths; resolve them against the runtime origin. */
  resolveSignedUrl(url: string): string {
    if (!url.startsWith('/')) {
      return url;
    }
    return `${this.staticBase || this.runtimeOrigin()}${url}`;
  }

  assignments(employeeId: string): Observable<ApiResponse<ListData<Assignment>>> {
    return this.api.get<ListData<Assignment>>(
      this.url(`/api/v1/employee/employees/${employeeId}/assignments`));
  }

  createAssignment(employeeId: string, payload: AssignmentWriteRequest): Observable<ApiResponse<Assignment>> {
    return this.api.post<Assignment>(
      this.url(`/api/v1/employee/employees/${employeeId}/assignments`), payload);
  }

  contracts(employeeId: string): Observable<ApiResponse<ListData<Contract>>> {
    return this.api.get<ListData<Contract>>(
      this.url(`/api/v1/employee/employees/${employeeId}/contracts`));
  }

  createContract(employeeId: string, payload: ContractWriteRequest): Observable<ApiResponse<Contract>> {
    return this.api.post<Contract>(
      this.url(`/api/v1/employee/employees/${employeeId}/contracts`), payload);
  }

  updateContract(contractId: string, payload: ContractWriteRequest): Observable<ApiResponse<Contract>> {
    return this.api.put<Contract>(this.url(`/api/v1/employee/contracts/${contractId}`), payload);
  }

  branches(): Observable<ApiResponse<ListData<BranchOption>>> {
    return this.api.get<ListData<BranchOption>>(this.orgUrl('/api/v1/org/branches'));
  }

  departments(): Observable<ApiResponse<ListData<DepartmentOption>>> {
    return this.api.get<ListData<DepartmentOption>>(this.orgUrl('/api/v1/org/departments'));
  }
}
