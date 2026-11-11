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
  employee_code?: string;
  employee_name?: string;
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
  employee_code?: string;
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
  employee_code?: string;
  employee_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approval_mode: 'ENGINE' | 'INTERNAL_FALLBACK';
  approval_flow?: string;
  reason?: string;
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

export interface ApprovalStepInfo {
  step_number: number;
  step_name: string;
  actor_name: string;
  actor_role: string;
  status: 'COMPLETED' | 'PENDING' | 'WAITING' | 'REJECTED';
  action_time?: string | null;
  comment?: string | null;
}

export interface RequestWorkflowInfo {
  workflow_key: string;
  workflow_name: string;
  instance_id: string;
  engine: string;
  current_step: number;
  total_steps: number;
  sla_hours: number;
  steps: ApprovalStepInfo[];
  form_payload?: {
    leave_type?: string;
    from_date?: string;
    to_date?: string;
    duration_days?: number;
    current_balance?: number;
    handover_colleague?: string;
    reason?: string;
    overtime_hours?: number;
    original_shift?: string;
    project_name?: string;
    multiplier?: string;
    meal_allowance?: string;
    destination?: string;
    advance_amount?: string;
    swap_with_name?: string;
    target_shift?: string;
    swap_date?: string;
    fix_date?: string;
    missing_punch_type?: string;
    late_minutes?: number;
    makeup_hours?: string;
  };
  post_actions?: Array<{
    type: string;
    description: string;
    status: 'PENDING' | 'APPLIED';
  }>;
}

export interface KioskEmployee {
  id: string;
  code: string;
  name: string;
  department: string;
  branch_code?: string;
  branch_name?: string;
  avatar_initials: string;
  punched_today: boolean;
  last_punch_time?: string | null;
  last_punch_type?: 'IN' | 'OUT' | null;
  photo_url?: string | null;
  work_email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  employee_type?: string | null;
}

export interface TimesheetClosingChecklist {
  pending_leaves: number;
  pending_ot: number;
  pending_trips: number;
  pending_fixes: number;
  unresolved_anomalies: number;
  dispute_count: number;
  all_requests_resolved: boolean;
  anomalies_resolved: boolean;
  calculation_completed: boolean;
  disputes_resolved: boolean;
  is_ready_to_lock: boolean;
}

export interface WorkflowDefinitionCatalogItem {
  request_type_code: string;
  request_type_name: string;
  workflow_key: string;
  workflow_name: string;
  steps_count: number;
  sla_hours: number;
  auto_action: string;
  is_active: boolean;
}

export interface WorkflowApprovalLevel {
  level: number;
  role_key: string;
  role_name: string;
  assignee_type: 'ROLE' | 'DIRECT_MANAGER' | 'SPECIFIC_USER';
  description: string;
  required: boolean;
  condition?: string;
}

export interface AttendanceWorkflowPolicy {
  id: string;
  workflow_type: 'LEAVE' | 'OVERTIME' | 'ATTENDANCE_FIX' | 'BUSINESS_TRIP' | 'TIMESHEET_CLOSING';
  name: string;
  description: string;
  active: boolean;
  sla_hours: number;
  levels_count: number;
  approval_levels: WorkflowApprovalLevel[];
  configured_by_role: string;
  configured_by_name: string;
  updated_at: string;
}

export interface KioskDevice {
  id: string;
  device_code: string;
  location_name: string;
  branch_code: string;
  branch_name: string;
  ip_address: string;
  status: 'ONLINE' | 'OFFLINE';
  device_token: string;
  today_punches: number;
  last_heartbeat: string;
  public_url: string;
  allowed_departments: string[];
}


