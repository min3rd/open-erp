import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_CHECK_KEY } from './tenant.guard';

/**
 * @SkipTenantCheck() — Skip the TenantGuard for this handler or controller.
 *
 * Use only on system-admin or cross-tenant operations that are intentionally
 * not scoped to a single organization (e.g., super-admin panel, global health checks).
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
