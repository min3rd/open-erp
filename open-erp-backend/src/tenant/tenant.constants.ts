export const TENANT_SUBDOMAIN_BLACKLIST = new Set([
  'admin',
  'api',
  'www',
  'mail',
  'support',
  'app',
  'dashboard',
  'status',
  'docs',
  'help',
]);

export const TENANT_SUBDOMAIN_REGEX = /^[a-z0-9-]{3,30}$/;
export const TAX_CODE_REGEX = /^(\d{10}|\d{13})$/;
