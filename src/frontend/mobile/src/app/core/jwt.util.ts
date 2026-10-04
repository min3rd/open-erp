import { PlatformAdminRole, decodeJwtPayload, readBooleanClaim, readStringArrayClaim } from '@shared';

/**
 * Returns the effective functional permission list, or `null` when the token
 * does not carry the `permissions`/`functional_permissions` claim yet
 * (Sprint 02 backend rollout in progress).
 */
export function getJwtPermissions(token: string | null | undefined): string[] | null {
  const claims = decodeJwtPayload(token);
  return (
    readStringArrayClaim(claims, 'permissions') ??
    readStringArrayClaim(claims, 'functional_permissions') ??
    readStringArrayClaim(claims, 'perms')
  );
}

export function isMustChangePassword(token: string | null | undefined): boolean {
  return readBooleanClaim(decodeJwtPayload(token), 'must_change_password') === true;
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
