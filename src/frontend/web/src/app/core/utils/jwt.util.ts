export function decodeJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
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
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readStringArrayClaim(payload: Record<string, unknown> | null, claim: string): string[] | null {
  if (!payload) {
    return null;
  }
  const value = payload[claim];
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function readBooleanClaim(payload: Record<string, unknown> | null, claim: string): boolean | null {
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
