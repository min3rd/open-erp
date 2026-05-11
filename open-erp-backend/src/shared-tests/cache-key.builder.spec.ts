import { CacheKey } from '../../libs/shared/messaging/redis/cache-key.builder';

describe('CacheKey', () => {
  it('builds stable cache key patterns for user, permissions, tenant config and jwt blacklist', () => {
    expect(CacheKey.user('tenant-1', 'user-1')).toBe('user:tenant-1:user-1');
    expect(CacheKey.permissions('tenant-1', 'user-1')).toBe('perms:tenant-1:user-1');
    expect(CacheKey.tenantConfig('tenant-1')).toBe('tenant:config:tenant-1');
    expect(CacheKey.jwtBlacklist('jti-1')).toBe('jwt:blacklist:jti-1');
  });
});
