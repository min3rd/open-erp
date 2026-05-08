import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators';

export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * TenantGuard — Enforce multi-tenant isolation.
 *
 * Must be used AFTER JwtAuthGuard so that request.user is populated.
 * Rejects (403) any request where the authenticated user does not have
 * an organizationId, ensuring no cross-tenant data leakage.
 *
 * Use @SkipTenantCheck() on public/system-admin routes that intentionally
 * operate outside a tenant context (e.g., super-admin APIs).
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
 * @Controller('wms/warehouses')
 * export class WarehouseController {}
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip for routes decorated with @SkipTenantCheck()
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTenantCheck) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('[TenantGuard] No user context — possible misconfigured guard order');
      throw new ForbiddenException('Authentication required before tenant check');
    }

    const tenantId: string | undefined = user.organizationId;
    if (!tenantId || tenantId.trim() === '') {
      this.logger.warn(
        `[TenantGuard] Missing tenant_id for user ${user.userId ?? 'unknown'} — request rejected`,
      );
      throw new ForbiddenException(
        'Tenant context is required. Ensure your account is associated with an organization.',
      );
    }

    // Attach tenantId shortcut for convenience in controllers/services
    request.tenantId = tenantId;
    return true;
  }
}
