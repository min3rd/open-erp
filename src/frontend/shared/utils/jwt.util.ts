/**
 * Single JWT payload decoder shared by Web and Mobile.
 *
 * Tokens are decoded only to read non-authoritative claims (expiry, UI flags).
 * Signature verification and permission enforcement always stay server-side.
 */
export interface JwtClaims {
  sub?: string;
  email?: string;
  tenant_id?: string | null;
  role?: string;
  groups?: string[];
  permissions?: string[];
  platform_role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Returns the decoded payload of a `header.payload.signature` JWT, else null. */
export function decodeJwtPayload(token: string | null | undefined): JwtClaims | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    return null;
  }
}

/** Reads a claim that must be an array of strings, else null. */
export function readStringArrayClaim(payload: JwtClaims | null, claim: string): string[] | null {
  if (!payload) {
    return null;
  }
  const value = payload[claim];
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === 'string');
}

/** Reads a numeric claim (e.g. `exp`, `iat`), else null. */
export function readNumberClaim(payload: JwtClaims | null, claim: string): number | null {
  if (!payload) {
    return null;
  }
  const value = payload[claim];
  return typeof value === 'number' ? value : null;
}

/** Reads a boolean claim, tolerating the `"true"`/`"false"` string form. */
export function readBooleanClaim(payload: JwtClaims | null, claim: string): boolean | null {
  if (!payload) {
    return null;
  }
  const value = payload[claim];
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  return null;
}