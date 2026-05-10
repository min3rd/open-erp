export const CacheKey = {
  user: (tenantId: string, userId: string): string =>
    `user:${tenantId}:${userId}`,
  permissions: (tenantId: string, userId: string): string =>
    `perms:${tenantId}:${userId}`,
  tenantConfig: (tenantId: string): string => `tenant:config:${tenantId}`,
  jwtBlacklist: (jti: string): string => `jwt:blacklist:${jti}`,
};
