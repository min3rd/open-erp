export interface ApiResponse<T = any> {
  code: string;
  data: T;
  meta: Record<string, any>;
}

export interface ApiErrorResponse {
  code: string;
  message?: string;
  params?: Record<string, any>;
  timestamp?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_default: boolean;
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

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  language: string;
  timezone: string;
}

export interface TwoFactorStatus {
  is_enabled: boolean;
  enabled_at: string | null;
  backup_codes_remaining: number;
}

export interface TwoFactorSetupData {
  secret_key: string;
  qr_code_uri: string;
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
