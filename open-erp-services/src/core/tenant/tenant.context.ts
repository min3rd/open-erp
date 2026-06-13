import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId: string;
  subdomain: string;
}

export const tenantContextStorage = new AsyncLocalStorage<TenantContextStore>();
