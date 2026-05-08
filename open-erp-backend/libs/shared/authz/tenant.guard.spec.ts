import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

function makeContext(overrides: Partial<{ user: any; isPublic: boolean; skipTenant: boolean }> = {}) {
  const { user, isPublic = false, skipTenant = false } = overrides;
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) => {
    if (key === 'isPublic') return isPublic;
    if (key === 'skipTenantCheck') return skipTenant;
    return undefined;
  });

  const request: any = { user };
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { guard: new TenantGuard(reflector), context, request };
}

describe('TenantGuard', () => {
  it('should allow public routes without user', () => {
    const { guard, context } = makeContext({ isPublic: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow routes with @SkipTenantCheck()', () => {
    const { guard, context } = makeContext({ skipTenant: true, user: undefined });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject when no user in request', () => {
    const { guard, context } = makeContext({ user: undefined });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject when user has no organizationId', () => {
    const { guard, context } = makeContext({ user: { userId: 'u1', organizationId: undefined } });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject when organizationId is empty string', () => {
    const { guard, context } = makeContext({ user: { userId: 'u1', organizationId: '' } });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow when user has valid organizationId and attach tenantId', () => {
    const { guard, context, request } = makeContext({ user: { userId: 'u1', organizationId: 'org-123' } });
    expect(guard.canActivate(context)).toBe(true);
    expect(request.tenantId).toBe('org-123');
  });
});
