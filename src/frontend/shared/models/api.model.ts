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
