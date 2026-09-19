import { PlatformAdminRole } from '@shared';

export interface JwtClaims {
  sub?: string;
  email?: string;
  tenant_id?: string | null;
  role?: string;
  groups?: string[];
  permissions?: string[];
  platform_role?: string;
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string | null | undefined): JwtClaims | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (base64.length % 4)) % 4;
    const bytes = Uint8Array.from(atob(base64 + '='.repeat(padding)), char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Returns the effective functional permission list, or `null` when the token
 * does not carry the `permissions`/`functional_permissions` claim yet
 * (Sprint 02 backend rollout in progress).
 */
export function getJwtPermissions(token: string | null | undefined): string[] | null {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return null;
  }
  const raw =
    claims.permissions ??
    (claims as Record<string, unknown>)['functional_permissions'] ??
    (claims as Record<string, unknown>)['perms'];
  if (!Array.isArray(raw)) {
    return null;
  }
  return raw.filter((value): value is string => typeof value === 'string');
}

export function isMustChangePassword(token: string | null | undefined): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return false;
  }
  const raw = claims['must_change_password'];
  return raw === true || raw === 'true';
}

export function getPlatformRole(token: string | null | undefined): string | null {
  const claims = decodeJwtPayload(token);
  const role = claims?.platform_role;
  return typeof role === 'string' ? role : null;
}

/**
 * Platform portal roles synced with backend `PlatformRoleRequiredFilter`:
 * both `SUPER_ADMIN` and `SUPPORT_ENGINEER` tokens may enter the portal
 * (`platform_role` claim AND matching `groups` entry). `SUPPORT_ENGINEER` is
 * read-only — mutating actions are hidden on Mobile and rejected server-side.
 */
export function isPlatformAdmin(token: string | null | undefined): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return false;
  }
  const role = claims.platform_role;
  if (role !== PlatformAdminRole.SUPER_ADMIN && role !== PlatformAdminRole.SUPPORT_ENGINEER) {
    return false;
  }
  const groups = Array.isArray(claims.groups) ? claims.groups : [];
  return groups.includes(role);
}

export function isPlatformSuperAdmin(token: string | null | undefined): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return false;
  }
  const groups = Array.isArray(claims.groups) ? claims.groups : [];
  return claims.platform_role === PlatformAdminRole.SUPER_ADMIN && groups.includes(PlatformAdminRole.SUPER_ADMIN);
}
