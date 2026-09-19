import {
  AuditActorType,
  AuditResult,
  AuditScope,
  DataScope,
  ImpersonationLogStatus,
  PlatformAdminRole,
  PlatformAdminStatus,
  SubsystemStatus,
  SystemHealthStatus,
  TenantPlanTier,
  TenantStatus,
  TenantType,
  UserStatus
} from '../enums';

export interface ApiFieldError {
  field?: string;
  code: string;
  params?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message?: string;
  params?: Record<string, any>;
  data: T;
  errors?: ApiFieldError[];
}

export interface PagedData<T = any> {
  items: T[];
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
}

export interface ListData<T = any> {
  items: T[];
}

export interface ApiErrorResponse {
  success?: boolean;
  code: string;
  message?: string;
  params?: Record<string, any>;
  errors?: ApiFieldError[];
  timestamp?: string;
}

export interface AuthUser {
  user_id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
  /** @deprecated Use `user_id` (kept for Mobile backward compatibility) */
  id?: string;
}

export interface TenantInfo {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
  is_default: boolean;
  /** @deprecated Use `tenant_id` (kept for Mobile backward compatibility) */
  id?: string;
  /** @deprecated Use `tenant_name` (kept for Mobile backward compatibility) */
  name?: string;
  /** @deprecated Use `tenant_slug` (kept for Mobile backward compatibility) */
  slug?: string;
}

export interface LoginResult {
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  expires_in?: number;
  user?: AuthUser;
  requires_2fa?: boolean;
  requires_tenant_selection?: boolean;
  pre_auth_token?: string;
  tenants?: TenantInfo[];
}

export interface RefreshTokenData {
  access_token: string;
  expires_in: number;
}

export interface SlugCheckData {
  available: boolean;
}

export interface UserProfileData {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  language: string;
  timezone: string;
  /** @deprecated Use `user_id` (kept for Mobile backward compatibility) */
  id?: string;
}

export interface TwoFactorStatus {
  is_enabled: boolean;
  enabled_at: string | null;
  backup_codes_remaining: number;
}

export interface TwoFactorSetupData {
  secret_key: string;
  qr_code_uri: string;
}

export interface TwoFactorEnableData {
  is_enabled: boolean;
  enabled_at: string;
  backup_codes: string[];
}

export interface BackupCodesData {
  backup_codes: string[];
}

export interface UserSessionData {
  session_id: string;
  device: string;
  ip_address: string;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

export interface SessionsData {
  items: UserSessionData[];
}

// ---------------------------------------------------------------------------
// Sprint 02: Platform Administration (Super Admin)
// ---------------------------------------------------------------------------

export interface PlatformTenant {
  tenant_id: string;
  slug: string;
  name: string;
  type: TenantType;
  plan_tier: TenantPlanTier;
  status: TenantStatus;
  max_users: number;
  active_users_count: number;
  max_storage_mb: number;
  used_storage_mb: number;
  trial_ends_at: string | null;
  is_locked: boolean;
  lock_reason?: string | null;
  locked_at?: string | null;
  allowed_plugins?: string[];
  created_at: string;
}

export interface PlatformUser {
  user_id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  tenant_id: string | null;
  tenant_name: string | null;
  last_login_at: string | null;
  is_2fa_enabled: boolean;
}

export interface TenantUser {
  id: string;
  /** Raw key returned by the backend user directory (`GET /iam/users`). */
  user_id?: string;
  email: string;
  full_name: string;
  status: UserStatus;
  joined_at?: string | null;
}

export interface AuditLogDetails {
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  reason?: string | null;
  extra?: Record<string, any> | null;
}

export interface AuditLog {
  log_id: string;
  event_id: string;
  scope: AuditScope;
  tenant_id: string | null;
  actor_user_id: string | null;
  actor_type: AuditActorType;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  target_tenant_id: string | null;
  target_tenant_name: string | null;
  target_user_id?: string | null;
  result: AuditResult;
  correlation_id: string;
  details: AuditLogDetails | null;
  ip_address: string | null;
  user_agent?: string | null;
  prev_hash?: string | null;
  entry_hash?: string | null;
  created_at: string;
}

export interface PlatformAdmin {
  admin_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: PlatformAdminRole;
  status: PlatformAdminStatus;
  must_change_password: boolean;
  two_factor_required: boolean;
  is_2fa_enabled: boolean;
  last_login_at: string | null;
  disabled_at: string | null;
  created_at: string;
}

export interface ImpersonationLog {
  log_id: string;
  super_admin_user_id: string;
  super_admin_email: string;
  target_tenant_id: string;
  target_user_id: string;
  support_ticket: string;
  status: ImpersonationLogStatus;
  started_at: string;
  ended_at: string | null;
}

export interface ImpersonationSessionData {
  impersonation_token: string;
  expires_in_seconds: number;
  target_tenant_id: string;
  target_tenant_name: string;
  target_user_id: string;
  target_user_email: string;
  started_at: string;
}

export interface DatabaseHealth {
  primary: SubsystemStatus;
  replica: SubsystemStatus;
  replication_lag_ms: number | null;
  active_connections: number;
  max_connections: number;
}

export interface RedisHealth {
  status: SubsystemStatus;
  used_memory_human: string;
  connected_clients: number;
}

export interface KafkaHealth {
  status: SubsystemStatus;
  cluster_id: string | null;
  nodes_count: number;
}

export interface PlatformMetrics {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  total_users: number;
  active_sessions_now: number;
}

export interface HealthSnapshot {
  system_status: SystemHealthStatus;
  database: DatabaseHealth;
  redis: RedisHealth;
  kafka: KafkaHealth;
  platform_metrics: PlatformMetrics;
}

export interface TenantQuotaPayload {
  plan_tier: TenantPlanTier;
  max_users: number;
  max_storage_mb: number;
  allowed_plugins: string[];
}

export interface PlatformPlugin {
  key: string;
  name_key: string;
  description_key: string;
  is_core: boolean;
}

export interface TenantStatusPayload {
  tenant_id: string;
  status: TenantStatus;
  is_locked: boolean;
  locked_at: string | null;
}

// ---------------------------------------------------------------------------
// Sprint 02: IAM (Functional RBAC & Data Policies)
// ---------------------------------------------------------------------------

export interface Permission {
  id: string;
  /** Present in `GET /iam/roles/{id}/permissions` items (DES-02-API §5.3.1). */
  permission_id?: string;
  code: string;
  domain: string;
  resource: string;
  action: string;
  description_key?: string;
  granted_at?: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  assigned_users_count: number;
}

export interface UserRoleItem {
  role_id: string;
  code: string;
  name: string;
  is_system: boolean;
  assigned_at: string;
}

export interface DataPolicy {
  role_id?: string;
  resource: string;
  create_scope: DataScope;
  read_scope: DataScope;
  update_scope: DataScope;
  delete_scope: DataScope;
  export_scope: DataScope;
  share_scope: DataScope;
}

export interface DataResource {
  resource: string;
  entity_class: string;
  table_name: string;
  plugin: string;
  supports_assignee: boolean;
}

// ---------------------------------------------------------------------------
// Sprint 02: Organization (Branches, Departments, Memberships, Assignments)
// ---------------------------------------------------------------------------

export interface Branch {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  is_default?: boolean;
  status?: string;
}

export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  branch_id?: string | null;
  branch_name?: string | null;
  parent_id?: string | null;
  manager_user_id?: string | null;
  manager_name?: string | null;
  status?: string;
  children: DepartmentNode[];
}

export interface Membership {
  id: string;
  user_id: string;
  user_email?: string | null;
  user_full_name?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  direct_manager_user_id?: string | null;
  direct_manager_name?: string | null;
  title?: string | null;
  is_primary?: boolean;
  joined_at?: string | null;
}

export interface BranchAssignment {
  id: string;
  user_id: string;
  user_email?: string | null;
  branch_id: string;
  branch_code?: string | null;
  is_primary: boolean;
  can_manage: boolean;
}

// ---------------------------------------------------------------------------
// Sprint 02: Reference Entity (Core Sample Records)
// ---------------------------------------------------------------------------

export interface SampleRecord {
  id: string;
  title: string;
  amount: number;
  status: string;
  branch_id?: string | null;
  branch_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SampleRecordExportData {
  file_url?: string | null;
  download_url?: string | null;
  total_records?: number;
  expires_at?: string | null;
}

export interface FlatDepartmentNode extends DepartmentNode {
  depth: number;
}
