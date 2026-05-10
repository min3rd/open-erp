export const SERVICE_ROUTE_PREFIXES: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
  tenants: process.env.TENANT_SERVICE_URL ?? 'http://localhost:3002',
  users: process.env.USER_SERVICE_URL ?? 'http://localhost:3003',
  roles: process.env.RBAC_SERVICE_URL ?? 'http://localhost:3004',
  catalogs: process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3005',
  'audit-logs': process.env.AUDIT_SERVICE_URL ?? 'http://localhost:3006',
  notifications:
    process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3007',
};
