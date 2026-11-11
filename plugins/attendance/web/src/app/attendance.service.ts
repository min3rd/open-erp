import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, ApiService, ListData, PagedData } from '@shared';
import {
  AttendanceLog,
  AttendanceRecord,
  AttendanceRequest,
  AttendanceSummary,
  KioskEmployee,
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveType,
  PunchResponse,
  PunchType,
  RequestType,
  ShiftDefinition,
  Timesheet,
  TimesheetConfirmation,
  TimesheetEntry,
} from './attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private staticBase = inject(API_BASE_URL);
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/attendance');
    return `${prefix}${path}`;
  }

  // Check-in / Punch
  punch(payload: {
    punch_type: PunchType;
    source: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    note?: string | null;
  }): Observable<ApiResponse<PunchResponse>> {
    return this.api.post<PunchResponse>(this.url('/api/v1/attendance/punch'), payload);
  }

  kioskPunch(payload: {
    device_code: string;
    employee_code: string;
    pin: string;
    punch_type: PunchType;
  }): Observable<ApiResponse<PunchResponse>> {
    return this.api.post<PunchResponse>(this.url('/api/v1/attendance/kiosk/punch'), payload);
  }

  kioskEmployees(deviceCode = 'KIOSK-LOBBY-01'): Observable<ApiResponse<ListData<KioskEmployee>>> {
    return this.api.get<ListData<KioskEmployee>>(this.url(`/api/v1/attendance/kiosks/${deviceCode}/employees`));
  }

  myStatus(): Observable<ApiResponse<any>> {
    return this.api.get<any>(this.url('/api/v1/attendance/my-status'));
  }

  myLogs(page = 1, size = 30): Observable<ApiResponse<PagedData<AttendanceLog>>> {
    return this.api.get<PagedData<AttendanceLog>>(this.url(`/api/v1/attendance/my-logs?page=${page}&size=${size}`));
  }

  adminLogs(page = 1, size = 50): Observable<ApiResponse<PagedData<AttendanceLog>>> {
    return this.api.get<PagedData<AttendanceLog>>(this.url(`/api/v1/attendance/admin/logs?page=${page}&size=${size}`));
  }

  adminRecords(page = 1, size = 50): Observable<ApiResponse<PagedData<AttendanceRecord>>> {
    return this.api.get<PagedData<AttendanceRecord>>(this.url(`/api/v1/attendance/admin/records?page=${page}&size=${size}`));
  }

  // Requests
  myRequests(page = 1, size = 20): Observable<ApiResponse<PagedData<AttendanceRequest>>> {
    return this.api.get<PagedData<AttendanceRequest>>(this.url(`/api/v1/attendance/requests/my-requests?page=${page}&size=${size}`));
  }

  requestInbox(page = 1, size = 20): Observable<ApiResponse<PagedData<AttendanceRequest>>> {
    return this.api.get<PagedData<AttendanceRequest>>(this.url(`/api/v1/attendance/requests/inbox?page=${page}&size=${size}`));
  }

  getRequest(id: string): Observable<ApiResponse<AttendanceRequest>> {
    return this.api.get<AttendanceRequest>(this.url(`/api/v1/attendance/requests/${id}`));
  }

  submitRequest(payload: {
    request_type_code: string;
    data: Record<string, unknown>;
  }): Observable<ApiResponse<AttendanceRequest>> {
    return this.api.post<AttendanceRequest>(this.url('/api/v1/attendance/requests'), payload);
  }

  fallbackAction(id: string, action: 'APPROVE' | 'REJECT', comment?: string): Observable<ApiResponse<AttendanceRequest>> {
    return this.api.post<AttendanceRequest>(this.url(`/api/v1/attendance/requests/${id}/fallback-action`), {
      action,
      comment
    });
  }

  requestTypes(): Observable<ApiResponse<ListData<RequestType>>> {
    return this.api.get<ListData<RequestType>>(this.url('/api/v1/attendance/request-types'));
  }

  // Leave
  myLeaveBalances(): Observable<ApiResponse<ListData<LeaveBalance>>> {
    return this.api.get<ListData<LeaveBalance>>(this.url('/api/v1/attendance/my-leave-balances'));
  }

  adminLeaveBalances(page = 1, size = 50): Observable<ApiResponse<PagedData<LeaveBalance>>> {
    return this.api.get<PagedData<LeaveBalance>>(this.url(`/api/v1/attendance/admin/leave-balances?page=${page}&size=${size}`));
  }

  leaveTypes(): Observable<ApiResponse<ListData<LeaveType>>> {
    return this.api.get<ListData<LeaveType>>(this.url('/api/v1/attendance/admin/leave-types'));
  }

  grantLeave(payload: {
    employee_ids: string[];
    leave_type_id: string;
    days: number;
    valid_until?: string | null;
    note?: string | null;
  }): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url('/api/v1/attendance/admin/leave-ledger/grants'), payload);
  }

  adjustLeave(payload: {
    employee_id: string;
    leave_type_id: string;
    days: number;
    note: string;
  }): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url('/api/v1/attendance/admin/leave-ledger/adjustments'), payload);
  }

  leaveLedger(employeeId?: string, page = 1, size = 50): Observable<ApiResponse<PagedData<LeaveLedgerEntry>>> {
    const q = employeeId ? `?employee_id=${employeeId}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
    return this.api.get<PagedData<LeaveLedgerEntry>>(this.url(`/api/v1/attendance/admin/leave-ledger${q}`));
  }

  // Shifts
  shifts(): Observable<ApiResponse<ListData<ShiftDefinition>>> {
    return this.api.get<ListData<ShiftDefinition>>(this.url('/api/v1/attendance/admin/shifts'));
  }

  saveShift(payload: Partial<ShiftDefinition>): Observable<ApiResponse<ShiftDefinition>> {
    if (payload.id) {
      return this.api.put<ShiftDefinition>(this.url(`/api/v1/attendance/admin/shifts/${payload.id}`), payload);
    }
    return this.api.post<ShiftDefinition>(this.url('/api/v1/attendance/admin/shifts'), payload);
  }

  // Timesheets
  timesheets(page = 1, size = 20): Observable<ApiResponse<PagedData<Timesheet>>> {
    return this.api.get<PagedData<Timesheet>>(this.url(`/api/v1/attendance/admin/timesheets?page=${page}&size=${size}`));
  }

  getTimesheet(id: string): Observable<ApiResponse<Timesheet>> {
    return this.api.get<Timesheet>(this.url(`/api/v1/attendance/admin/timesheets/${id}`));
  }

  createTimesheet(payload: {
    name: string;
    period_start: string;
    period_end: string;
  }): Observable<ApiResponse<Timesheet>> {
    return this.api.post<Timesheet>(this.url('/api/v1/attendance/admin/timesheets'), payload);
  }

  changeTimesheetStep(id: string, step: string): Observable<ApiResponse<Timesheet>> {
    return this.api.post<Timesheet>(this.url(`/api/v1/attendance/admin/timesheets/${id}/step`), { step });
  }

  lockTimesheet(id: string, reason: string): Observable<ApiResponse<Timesheet>> {
    return this.api.post<Timesheet>(this.url(`/api/v1/attendance/admin/timesheets/${id}/lock`), { reason });
  }

  unlockTimesheet(id: string, reason: string): Observable<ApiResponse<Timesheet>> {
    return this.api.post<Timesheet>(this.url(`/api/v1/attendance/admin/timesheets/${id}/unlock`), { reason });
  }

  sendConfirmations(id: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url(`/api/v1/attendance/admin/timesheets/${id}/send-confirmations`), {});
  }

  confirmMyTimesheet(id: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url(`/api/v1/attendance/timesheets/${id}/confirm`), {});
  }

  rejectMyTimesheet(id: string, note: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url(`/api/v1/attendance/timesheets/${id}/reject`), { note });
  }

  // Reports
  reportSummary(from?: string, to?: string): Observable<ApiResponse<AttendanceSummary>> {
    const q = from && to ? `?from=${from}&to=${to}` : '';
    return this.api.get<AttendanceSummary>(this.url(`/api/v1/attendance/reports/summary${q}`));
  }

  reportTeam(departmentId?: string, from?: string, to?: string): Observable<ApiResponse<ListData<any>>> {
    const q = departmentId ? `?department_id=${departmentId}` : '';
    return this.api.get<ListData<any>>(this.url(`/api/v1/attendance/reports/team${q}`));
  }

  reportTopLate(from?: string, to?: string, limit = 10): Observable<ApiResponse<ListData<any>>> {
    return this.api.get<ListData<any>>(this.url(`/api/v1/attendance/reports/top-late?limit=${limit}`));
  }

  reportOvertime(from?: string, to?: string): Observable<ApiResponse<ListData<any>>> {
    return this.api.get<ListData<any>>(this.url('/api/v1/attendance/reports/overtime'));
  }

  exportTimesheetCsv(id: string, templateId?: string): Observable<Blob> {
    const q = templateId ? `?template_id=${templateId}` : '';
    return this.http.post(this.url(`/api/v1/attendance/admin/timesheets/${id}/export${q}`), {}, {
      responseType: 'blob'
    });
  }
}

