export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'WFH'
  | 'ON_LEAVE'
  | 'BUSINESS_TRIP';

export type PunchType = 'IN' | 'OUT';
export type PunchSource = 'WEB' | 'MOBILE' | 'KIOSK' | 'BIOMETRIC' | 'IMPORT';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  punch_time: string;
  punch_type: PunchType;
  source: PunchSource;
  device_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  in_geofence?: boolean | null;
  distance_meters?: number | null;
  note?: string | null;
  is_valid: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  work_date: string;
  shift_id?: string | null;
  shift_code?: string | null;
  status: AttendanceStatus;
  in_time?: string | null;
  out_time?: string | null;
  late_minutes: number;
  early_minutes: number;
  work_hours: number;
  ot_hours: number;
  is_overridden: boolean;
  override_reason?: string | null;
  needs_review: boolean;
}

export interface ShiftDefinition {
  id: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_in_minutes: number;
  grace_out_minutes: number;
  break_start?: string | null;
  break_end?: string | null;
  work_hours: number;
  is_active: boolean;
}

export interface AttendanceRequest {
  id: string;
  request_number: string;
  request_type_code: string;
  request_type_name?: string;
  employee_id: string;
  employee_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approval_mode: 'ENGINE' | 'INTERNAL_FALLBACK';
  data: Record<string, unknown>;
  submitted_at: string;
  approved_at?: string | null;
  comment?: string | null;
  mapping_status?: 'NOT_APPLICABLE' | 'PENDING' | 'APPLIED' | 'FAILED';
}

export interface RequestType {
  id: string;
  code: string;
  name: string;
  is_system: boolean;
  window_days: number;
  form_definition_key?: string | null;
  workflow_definition_key?: string | null;
  is_active: boolean;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  paid: boolean;
  counts_as_work: boolean;
  deduct_balance: boolean;
  allow_negative: boolean;
  carry_over_max_days: number;
  default_annual_grant: number;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  leave_type_code?: string;
  granted: number;
  used: number;
  remaining: number;
  expiring: number;
  valid_until?: string | null;
}

export interface LeaveLedgerEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  entry_type: 'GRANT' | 'USAGE' | 'USAGE_REVERSAL' | 'ADJUSTMENT' | 'EXPIRY';
  days: number;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Timesheet {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  step: 'S1_LOGS' | 'S2_SCHEDULE' | 'S3_CALCULATE' | 'S4_ADJUST' | 'DONE';
  locked: boolean;
  locked_at?: string | null;
  total_employees?: number;
  total_work_hours?: number;
  total_ot_hours?: number;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  employee_id: string;
  employee_name: string;
  work_days: number;
  work_hours: number;
  ot_hours: number;
  leave_days: number;
  absent_days: number;
  late_count: number;
  status: string;
}

export interface TimesheetConfirmation {
  id: string;
  timesheet_id: string;
  employee_id: string;
  employee_name: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  note?: string | null;
  responded_at?: string | null;
}

export interface AttendanceSummary {
  total_employees: number;
  present_count: number;
  absent_count: number;
  on_leave_count: number;
  late_count: number;
  attendance_rate: number;
}

export interface PunchResponse {
  log_id: string;
  punch_type: PunchType;
  punch_time: string;
  in_geofence: boolean;
  distance_meters: number;
  today_status: AttendanceStatus;
}

