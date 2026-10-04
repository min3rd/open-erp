export enum PlatformAdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT_ENGINEER = 'SUPPORT_ENGINEER'
}

export enum PlatformAdminStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  REVOKED = 'REVOKED'
}

export enum AuditScope {
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT'
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  DENIED = 'DENIED',
  FAILED = 'FAILED'
}

export enum AuditActorType {
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM = 'SYSTEM',
  CLI = 'CLI'
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  PENDING_DELETION = 'PENDING_DELETION',
  DELETED = 'DELETED'
}

export enum TenantPlanTier {
  COMMUNITY = 'COMMUNITY',
  STANDARD = 'STANDARD',
  ENTERPRISE = 'ENTERPRISE'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED'
}

export enum SystemHealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN'
}

export enum SubsystemStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN'
}

export enum BreakGlassAction {
  FORCE_PASSWORD_RESET = 'FORCE_PASSWORD_RESET',
  DISABLE_2FA = 'DISABLE_2FA'
}
