export interface EmployeeSummary {
  id: string;
  employee_code: string;
  user_id?: string;
  status?: string;
  employee_type?: string;
  full_name: string;
  work_email?: string;
  phone?: string;
  scope_sync_status?: string;
}

export interface EmployeeDetail extends EmployeeSummary {
  photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  national_id?: string;
  tax_code?: string;
  social_insurance_no?: string;
  health_insurance_no?: string;
  personal_email?: string;
  current_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  education_level?: string;
  school?: string;
  major?: string;
  graduation_year?: number;
  notes?: string;
  exit_date?: string;
  exit_reason?: string;
  version?: number;
}

export interface EmployeeWriteRequest {
  employee_code?: string;
  full_name?: string;
  status?: string;
  employee_type?: string;
  work_email?: string;
  personal_email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  national_id?: string;
  tax_code?: string;
  social_insurance_no?: string;
  health_insurance_no?: string;
  current_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  education_level?: string;
  school?: string;
  major?: string;
  graduation_year?: number;
  notes?: string;
  exit_date?: string;
  exit_reason?: string;
}

export interface ChangeRequestStep {
  id: string;
  request_id: string;
  step_no: number;
  approver_type?: string;
  approver_id?: string;
  status: string;
  acted_by?: string;
  acted_at?: string;
  comment?: string;
}

export interface ChangeRequest {
  id: string;
  employee_id: string;
  requested_by_user_id?: string;
  status: string;
  current_step?: number;
  changes: Record<string, unknown>;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  version?: number;
  created_at?: string;
  steps?: ChangeRequestStep[];
}

export interface FieldConfig {
  field_key: string;
  editable_by_employee: boolean;
  requires_approval: boolean;
  sort_order?: number;
}

export interface ApprovalConfig {
  id?: string;
  scope_type: string;
  scope_id?: string;
  field_group: string;
  step_no: number;
  approver_type: string;
  approver_id?: string;
}

export interface OrgChartNode {
  employee_id: string;
  employee_code: string;
  full_name: string;
  status?: string;
  employee_type?: string;
  manager_employee_id?: string;
  depth: number;
}

export interface OnboardingInvite {
  id: string;
  employee_id?: string;
  email: string;
  status: string;
  expires_at?: string;
  submitted_at?: string;
  token?: string;
  link?: string;
  in_app_notified?: boolean;
  notify_reason?: string;
}

export interface Campaign {
  id: string;
  name: string;
  filter?: Record<string, unknown>;
  deadline?: string;
  status: string;
  created_at?: string;
}

export interface PrivacyRequest {
  id: string;
  employee_id?: string;
  subject_user_id?: string;
  request_type: string;
  status: string;
  due_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface ImportResult {
  dry_run: boolean;
  imported: number;
  errors: Array<{ row: number; code: string; field?: string }>;
}

export interface DirectoryEntry {
  id: string;
  employee_code: string;
  full_name: string;
  work_email?: string;
  phone?: string;
  employee_type?: string;
  status?: string;
  job_title?: string;
  branch_id?: string;
  department_id?: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  scan_status?: string;
  status?: string;
  version?: number;
  created_at?: string;
}

export interface SignedUrlResponse {
  document_id: string;
  url: string;
  expires_at: string;
}

export interface Assignment {
  id: string;
  employee_id: string;
  branch_id?: string;
  department_id?: string;
  job_title?: string;
  manager_employee_id?: string;
  is_primary?: boolean;
  valid_from?: string;
  valid_to?: string;
  status?: string;
}

export interface AssignmentWriteRequest {
  branch_id: string;
  department_id: string;
  job_title: string;
  manager_employee_id?: string;
  is_primary?: boolean;
  valid_from?: string;
  valid_to?: string;
  status?: string;
}

export interface Contract {
  id: string;
  employee_id: string;
  contract_type?: string;
  contract_no?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  document_id?: string;
}

export interface ContractWriteRequest {
  contract_type: string;
  contract_no: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  document_id?: string;
}

export interface BranchOption {
  id: string;
  code?: string;
  name: string;
  status?: string;
}

export interface DepartmentOption {
  id: string;
  branch_id?: string;
  code?: string;
  name: string;
  status?: string;
}
