function readPermissions(): string[] {
  try {
    const token = localStorage.getItem('openerp_token');
    if (!token) return [];
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(payload ?? ''));
    return Array.isArray(json?.permissions) ? json.permissions : [];
  } catch {
    return [];
  }
}

export const pluginPermissionChecker = (permission?: string): boolean =>
  !permission || readPermissions().includes(permission);
