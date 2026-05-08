/**
 * Authorization module exports
 * Provides decorators, guards, and services for RBAC-based access control
 */

// Decorators
export {
  Public,
  Permissions,
  Roles,
  IS_PUBLIC_KEY,
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
  PERMISSION_SCOPE_KEY,
  PERMISSION_MODE_KEY,
} from './decorators';

export type {
  PermissionScope,
  PermissionMode,
  PermissionOptions,
} from './decorators';

// Current User Decorator
export { CurrentUser } from './current-user.decorator';

// Guards
export { PermissionsGuard } from './permissions.guard';
export type { UserContext } from './permissions.guard';
export { JwtAuthGuard } from './jwt-auth.guard';
export { RolesGuard } from './roles.guard';
export { SystemAdminThrottlerGuard } from './system-admin-throttler.guard';
export { TenantGuard, SKIP_TENANT_CHECK_KEY } from './tenant.guard';

// Tenant Interceptor
export { TenantInterceptor } from './tenant.interceptor';

// Tenant Policy
export {
  TenantPolicyService,
  UpdateTenantPolicyDto,
} from './tenant-policy.service';
export type { TenantPolicy } from './tenant-policy.service';

// Tenant Decorators
export { SkipTenantCheck } from './skip-tenant-check.decorator';

// Service
export { AuthorizationService } from './authorization.service';
export type { PermissionCheckOptions } from './authorization.service';

// Utilities
export {
  verifyToken,
  generateRandomSecret,
  extractBearerToken,
} from './utils/token.util';

export type { JwtPayload } from './utils/token.util';

// Interfaces
export type {
  ITokenResolver,
  IUserResolver,
} from './interfaces/resolver.interface';
