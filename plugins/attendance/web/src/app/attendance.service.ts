import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, ApiResponse, ApiService, ListData, PagedData } from '@shared';
import {
  AttendanceLog,
  AttendanceRecord,
  AttendanceRequest,
  AttendanceSummary,
  EmployeeDirectory,
  ShiftCoverage,
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
  MyTimesheet,
  AuditLogEntry,
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
  }): Observable<ApiResponse<any>> {
    if (payload.punch_type === 'OUT') {
      return this.http.post<ApiResponse<any>>(
        this.url('/api/v1/attendance/check-out'),
        {},
        { headers: new HttpHeaders({ 'X-Client-Platform': payload.source.toLowerCase() }) },
      );
    }
    return this.http.post<ApiResponse<any>>(
      this.url('/api/v1/attendance/check-in'),
      { gps: { lat: payload.latitude ?? 0, lng: payload.longitude ?? 0 } },
      { headers: new HttpHeaders({ 'X-Client-Platform': payload.source.toLowerCase() }) },
    );
  }

  kioskAuthenticate(deviceCode: string, token: string, employeeCode: string, pin: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(
      this.url(`/api/v1/attendance/kiosks/${encodeURIComponent(deviceCode)}/authenticate?token=${encodeURIComponent(token)}`),
      { employee_code: employeeCode, pin },
    );
  }

  kioskPunch(deviceCode: string, token: string, sessionToken: string, employeeCode: string, eventType: PunchType): Observable<ApiResponse<PunchResponse>> {
    return this.api.post<PunchResponse>(
      this.url(`/api/v1/attendance/kiosks/${encodeURIComponent(deviceCode)}/punch?token=${encodeURIComponent(token)}&session=${encodeURIComponent(sessionToken)}`),
      { employee_code: employeeCode, event_type: eventType },
    );
  }

  kioskEmployees(deviceCode: string, token: string): Observable<ApiResponse<ListData<KioskEmployee>>> {
    return this.api.get<ListData<KioskEmployee>>(
      this.url(`/api/v1/attendance/kiosks/${encodeURIComponent(deviceCode)}/employees?token=${encodeURIComponent(token)}`),
    );
  }

  myStatus(): Observable<ApiResponse<any>> {
    return this.api.get<any>(this.url('/api/v1/attendance/my-status'));
  }

  setMyKioskPin(pin: string): Observable<ApiResponse<{ employee_id: string }>> {
    return this.api.put<{ employee_id: string }>(this.url('/api/v1/attendance/my-kiosk-pin'), { pin });
  }

  myLogs(page = 1, size = 30): Observable<ApiResponse<PagedData<AttendanceLog>>> {
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/my-logs?page=${page}&size=${size}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapLog(item)) } : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<AttendanceLog>>>;
  }

  adminLogs(
    page = 1,
    size = 50,
    source?: string,
    from?: string,
    to?: string
  ): Observable<ApiResponse<PagedData<AttendanceLog>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (source) params.set('source', source);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/admin/logs?${params.toString()}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapLog(item)) } : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<AttendanceLog>>>;
  }

  importLogs(csv: string): Observable<ApiResponse<{ imported: number; errors: string[] }>> {
    return this.http.post<ApiResponse<{ imported: number; errors: string[] }>>(
      this.url('/api/v1/attendance/admin/logs/import'),
      csv,
      { headers: new HttpHeaders({ 'Content-Type': 'text/csv' }) },
    );
  }

  adminRecords(page = 1, size = 50, workDate?: string): Observable<ApiResponse<PagedData<AttendanceRecord>>> {
    const date = workDate ? `&work_date=${workDate}` : '';
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/admin/records?page=${page}&size=${size}${date}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapRecord(item)) } : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<AttendanceRecord>>>;
  }

  needsReviewCount(): Observable<ApiResponse<PagedData<AttendanceRecord>>> {
    return this.api.get<PagedData<AttendanceRecord>>(
      this.url('/api/v1/attendance/admin/records?needs_review=true&page=1&size=1')
    );
  }

  // Requests
  myRequests(
    page = 1,
    size = 20,
    filters?: { type?: string; status?: string }
  ): Observable<ApiResponse<PagedData<AttendanceRequest>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.type && filters.type !== 'ALL') params.set('type', filters.type);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/my-requests?${params.toString()}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data
            ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapRequest(item)) }
            : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<AttendanceRequest>>>;
  }

  requestInbox(page = 1, size = 20): Observable<ApiResponse<PagedData<AttendanceRequest>>> {
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/requests/inbox?page=${page}&size=${size}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data
            ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapRequest(item)) }
            : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<AttendanceRequest>>>;
  }

  getRequest(id: string): Observable<ApiResponse<AttendanceRequest>> {
    return this.api
      .get<any>(this.url(`/api/v1/attendance/requests/${id}`))
      .pipe(map((res) => ({ ...res, data: this.mapRequest(res.data) })));
  }

  private mapLog(raw: any): AttendanceLog {
    let meta = raw?.meta;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }
    meta = meta || {};
    return {
      ...raw,
      employee_code: raw?.employee_code || '',
      employee_name: raw?.employee_name || '',
      punch_time: raw?.occurred_at || raw?.punch_time || '',
      punch_type: raw?.event_type || raw?.punch_type || 'IN',
      source: raw?.source || '',
      device_id: raw?.device_id ?? null,
      latitude: raw?.latitude ?? meta.latitude ?? null,
      longitude: raw?.longitude ?? meta.longitude ?? null,
      address: raw?.address ?? meta.address ?? null,
      in_geofence: raw?.in_geofence ?? meta.in_geofence ?? null,
      distance_meters: raw?.distance_meters ?? meta.distance_meters ?? null,
      note: raw?.note ?? meta.note ?? null,
      is_valid: raw?.is_valid ?? true,
      created_at: raw?.created_at || raw?.occurred_at || '',
    } as AttendanceLog;
  }

  private mapRecord(raw: any): AttendanceRecord {
    const workedMinutes = raw?.worked_minutes;
    const otMinutes = raw?.ot_minutes;
    return {
      ...raw,
      employee_code: raw?.employee_code || '',
      employee_name: raw?.employee_name || '',
      shift_id: raw?.shift_definition_id ?? raw?.shift_id ?? null,
      shift_code: raw?.shift_code || '',
      shift_name_snapshot: raw?.shift_name_snapshot ?? null,
      in_time: raw?.effective_in || raw?.in_time || null,
      out_time: raw?.effective_out || raw?.out_time || null,
      early_minutes: raw?.early_leave_minutes ?? raw?.early_minutes ?? 0,
      work_hours: workedMinutes != null ? Number(workedMinutes) / 60 : Number(raw?.work_hours || 0),
      ot_hours: otMinutes != null ? Number(otMinutes) / 60 : Number(raw?.ot_hours || 0),
      is_overridden: raw?.is_override ?? raw?.is_overridden ?? false,
      late_minutes: Number(raw?.late_minutes || 0),
      needs_review: raw?.needs_review ?? false,
    } as AttendanceRecord;
  }

  private mapRequest(raw: any): AttendanceRequest {
    const response = raw?.response || raw?.data || {};
    return {
      ...raw,
      request_number: raw?.code || raw?.request_number || '',
      code: raw?.code || raw?.request_number || '',
      employee_id: raw?.subject_employee_id || raw?.employee_id || '',
      employee_name: raw?.subject_employee_name || raw?.employee_name || '',
      data: response,
      response,
      submitted_at: raw?.created_at || raw?.submitted_at || '',
      approved_at: raw?.updated_at || raw?.approved_at || null,
      comment: raw?.fallback_comment || raw?.comment || null,
    } as AttendanceRequest;
  }

  submitRequest(payload: {
    request_type_code: string;
    data: Record<string, unknown>;
  }): Observable<ApiResponse<AttendanceRequest>> {
    return this.api
      .post<any>(this.url('/api/v1/attendance/requests'), {
        request_type_code: payload.request_type_code,
        response: payload.data,
        affected_window: payload.data,
      })
      .pipe(map((res) => ({ ...res, data: this.mapRequest(res.data) })));
  }

  fallbackAction(id: string, action: 'APPROVE' | 'REJECT', comment?: string): Observable<ApiResponse<AttendanceRequest>> {
    return this.api
      .post<any>(this.url(`/api/v1/attendance/requests/${id}/fallback-action`), {
        action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comment,
      })
      .pipe(map((res) => ({ ...res, data: this.mapRequest(res.data) })));
  }

  requestTypes(): Observable<ApiResponse<ListData<RequestType>>> {
    return this.api.get<ListData<RequestType>>(this.url('/api/v1/attendance/admin/request-types'));
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

  createLeaveType(payload: {
    code: string;
    name: string;
    paid: boolean;
    counts_as_work: boolean;
    deduct_balance: boolean;
    default_annual_grant: number;
  }): Observable<ApiResponse<LeaveType>> {
    return this.api.post<LeaveType>(this.url('/api/v1/attendance/admin/leave-types'), {
      ...payload,
      allow_negative: false,
      carry_over_max_days: 0,
      is_active: true,
    });
  }

  employees(): Observable<ApiResponse<ListData<EmployeeDirectory>>> {
    return this.api.get<ListData<EmployeeDirectory>>(this.url('/api/v1/attendance/admin/employees'));
  }

  employeeRecords(
    employeeId: string,
    from: string,
    to: string
  ): Observable<ApiResponse<ListData<AttendanceRecord>>> {
    return this.api
      .get<ListData<any>>(
        this.url(`/api/v1/attendance/admin/records/employee/${employeeId}?from=${from}&to=${to}`)
      )
      .pipe(
        map((res) => ({
          ...res,
          data: res.data
            ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapRecord(item)) }
            : res.data,
        }))
      ) as Observable<ApiResponse<ListData<AttendanceRecord>>>;
  }

  shiftCoverage(month: string): Observable<ApiResponse<ListData<ShiftCoverage>>> {
    return this.api.get<ListData<ShiftCoverage>>(
      this.url(`/api/v1/attendance/admin/shift-coverage?month=${month}`)
    );
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
    return this.api
      .get<ListData<any>>(this.url('/api/v1/attendance/admin/shifts?size=100'))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data
            ? {
                ...res.data,
                items: (res.data.items || []).map((shift: any) => ({
                  ...shift,
                  work_hours:
                    shift.work_hours ??
                    Math.round(((shift.working_minutes ?? 480) / 60) * 10) / 10,
                })),
              }
            : res.data,
        }))
      ) as Observable<ApiResponse<ListData<ShiftDefinition>>>;
  }

  bulkAssignShifts(payload: {
    shift_definition_id: string;
    from: string;
    to: string;
    employee_ids?: string[];
  }): Observable<ApiResponse<{ assigned: number; skipped: number }>> {
    return this.api.post<{ assigned: number; skipped: number }>(
      this.url('/api/v1/attendance/admin/shift-assignments/bulk'),
      payload
    );
  }

  createDevice(payload: {
    name: string;
    device_code: string;
    branch_id?: string | null;
    pin?: string | null;
    device_type?: string;
  }): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url('/api/v1/attendance/admin/devices'), {
      ...payload,
      device_type: payload.device_type || 'KIOSK',
    });
  }

  devices(): Observable<ApiResponse<PagedData<any>>> {
    return this.api.get<PagedData<any>>(this.url('/api/v1/attendance/admin/devices?page=1&size=200'));
  }

  rotateDeviceToken(id: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(this.url(`/api/v1/attendance/admin/devices/${id}/rotate`), {});
  }

  auditLogs(page = 1, size = 50, action?: string, entityType?: string): Observable<ApiResponse<PagedData<AuditLogEntry>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (action && action !== 'ALL') params.set('action', action);
    if (entityType && entityType !== 'ALL') params.set('entity_type', entityType);
    return this.api.get<PagedData<AuditLogEntry>>(
      this.url(`/api/v1/attendance/admin/audit?${params.toString()}`)
    );
  }

  saveShift(payload: Partial<ShiftDefinition>): Observable<ApiResponse<ShiftDefinition>> {
    if (payload.id) {
      return this.api.put<ShiftDefinition>(this.url(`/api/v1/attendance/admin/shifts/${payload.id}`), payload);
    }
    return this.api.post<ShiftDefinition>(this.url('/api/v1/attendance/admin/shifts'), payload);
  }

  // Timesheets
  private mapTimesheet(raw: any): Timesheet {
    const year = Number(raw?.period_year ?? 0);
    const month = Number(raw?.period_month ?? 0);
    const pad = (value: number) => String(value).padStart(2, '0');
    const lastDay = year && month ? new Date(year, month, 0).getDate() : 0;
    return {
      ...raw,
      name: year && month ? `${pad(month)}/${year}` : '',
      period_start: year && month ? `${year}-${pad(month)}-01` : '',
      period_end: year && month ? `${year}-${pad(month)}-${pad(lastDay)}` : '',
      locked: !!raw?.locked_at,
      snapshot: raw?.snapshot ?? null,
      total_employees: raw?.snapshot?.total_employees ?? undefined,
    } as Timesheet;
  }

  timesheets(page = 1, size = 20): Observable<ApiResponse<PagedData<Timesheet>>> {
    return this.api
      .get<PagedData<any>>(this.url(`/api/v1/attendance/admin/timesheets?page=${page}&size=${size}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data
            ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapTimesheet(item)) }
            : res.data,
        }))
      ) as Observable<ApiResponse<PagedData<Timesheet>>>;
  }

  getTimesheet(id: string): Observable<ApiResponse<Timesheet>> {
    return this.api
      .get<any>(this.url(`/api/v1/attendance/admin/timesheets/${id}`))
      .pipe(map((res) => ({ ...res, data: this.mapTimesheet(res.data) })));
  }

  createTimesheet(payload: {
    period_year: number;
    period_month: number;
    scope_type: string;
    wage_calc_mode: string;
  }): Observable<ApiResponse<Timesheet>> {
    return this.api
      .post<any>(this.url('/api/v1/attendance/admin/timesheets'), payload)
      .pipe(map((res) => ({ ...res, data: this.mapTimesheet(res.data) })));
  }

  changeTimesheetStep(id: string, step: string): Observable<ApiResponse<Timesheet>> {
    return this.api
      .post<any>(this.url(`/api/v1/attendance/admin/timesheets/${id}/step`), { step })
      .pipe(map((res) => ({ ...res, data: this.mapTimesheet(res.data) })));
  }

  lockTimesheet(id: string, reason: string): Observable<ApiResponse<Timesheet>> {
    return this.api
      .post<any>(this.url(`/api/v1/attendance/admin/timesheets/${id}/lock`), { reason })
      .pipe(map((res) => ({ ...res, data: this.mapTimesheet(res.data) })));
  }

  unlockTimesheet(id: string, reason: string): Observable<ApiResponse<Timesheet>> {
    return this.api
      .post<any>(this.url(`/api/v1/attendance/admin/timesheets/${id}/unlock`), { reason })
      .pipe(map((res) => ({ ...res, data: this.mapTimesheet(res.data) })));
  }

  recalculate(from: string, to: string): Observable<ApiResponse<{ calculated: number }>> {
    return this.api.post<{ calculated: number }>(this.url('/api/v1/attendance/admin/records/recalculate'), {
      from,
      to,
    });
  }

  myTimesheets(page = 1, size = 20): Observable<ApiResponse<PagedData<MyTimesheet>>> {
    return this.api.get<PagedData<MyTimesheet>>(
      this.url(`/api/v1/attendance/my-timesheets?page=${page}&size=${size}`)
    );
  }

  myRecords(from: string, to: string): Observable<ApiResponse<ListData<AttendanceRecord>>> {
    return this.api
      .get<ListData<any>>(this.url(`/api/v1/attendance/my-records?from=${from}&to=${to}`))
      .pipe(
        map((res) => ({
          ...res,
          data: res.data ? { ...res.data, items: (res.data.items || []).map((item: any) => this.mapRecord(item)) } : res.data,
        }))
      ) as Observable<ApiResponse<ListData<AttendanceRecord>>>;
  }

  timesheetConfirmations(id: string): Observable<ApiResponse<ListData<TimesheetConfirmation>>> {
    return this.api.get<ListData<TimesheetConfirmation>>(
      this.url(`/api/v1/attendance/admin/timesheets/${id}/confirmations`)
    );
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

  reportTeam(from?: string, to?: string): Observable<ApiResponse<ListData<any>>> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.api.get<ListData<any>>(this.url(`/api/v1/attendance/reports/team${q}`));
  }

  reportTopLate(from?: string, to?: string, limit = 10): Observable<ApiResponse<ListData<any>>> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.api.get<ListData<any>>(this.url(`/api/v1/attendance/reports/top-late?${params.toString()}`));
  }

  reportOvertime(from?: string, to?: string): Observable<ApiResponse<ListData<any>>> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.api.get<ListData<any>>(this.url(`/api/v1/attendance/reports/overtime${q}`));
  }

  exportTimesheetCsv(id: string, templateId?: string): Observable<Blob> {
    const q = templateId ? `?template_id=${templateId}` : '';
    return this.http.post(this.url(`/api/v1/attendance/admin/timesheets/${id}/export${q}`), {}, {
      responseType: 'blob'
    });
  }
}

