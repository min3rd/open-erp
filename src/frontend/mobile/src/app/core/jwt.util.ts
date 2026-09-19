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
 * does not carry the `permissions` claim yet (Sprint 02 backend in progress).
 */
export function getJwtPermissions(token: string | null | undefined): string[] | null {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return null;
  }
  const raw = claims.permissions ?? (claims as Record<string, unknown>)['perms'];
  if (!Array.isArray(raw)) {
    return null;
  }
  return raw.filter((value): value is string => typeof value === 'string');
}

export function isPlatformSuperAdmin(token: string | null | undefined): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return false;
  }
  const groups = Array.isArray(claims.groups) ? claims.groups : [];
  return claims.platform_role === 'SUPER_ADMIN' && groups.includes('SUPER_ADMIN');
}
