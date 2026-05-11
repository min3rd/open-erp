import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

const JWT_SECRET = 'test-secret';

function makeToken(payload: object, secret = JWT_SECRET, expiresIn = '1h') {
  return sign(payload, secret, { expiresIn } as Parameters<typeof sign>[2]);
}

function makeContext(
  token: string | null,
  isPublic = false,
): ExecutionContext {
  const authHeader = token ? `Bearer ${token}` : '';
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) =>
          name.toLowerCase() === 'authorization' ? authHeader : '',
        user: undefined as unknown,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        return undefined;
      }),
    } as unknown as ConfigService;

    guard = new JwtAuthGuard(reflector, configService);
  });

  it('allows request when route is marked @Public()', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = makeContext(null, true);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws UNAUTHORIZED when no token is provided', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = makeContext(null);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('allows request with valid HS256 token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const token = makeToken({ sub: 'user-1', tenantId: 'tenant-1' });
    const ctx = makeContext(token);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws TOKEN_INVALID for expired token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const token = makeToken({ sub: 'user-1' }, JWT_SECRET, '-1s');
    const ctx = makeContext(token);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws TOKEN_INVALID for token signed with wrong secret', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const token = makeToken({ sub: 'user-1' }, 'wrong-secret');
    const ctx = makeContext(token);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws TOKEN_INVALID when token is blacklisted', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    // Provide a Redis URL so the guard attempts to check blacklist
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return JWT_SECRET;
      if (key === 'REDIS_URL') return 'redis://localhost:6379';
      return undefined;
    });

    // Re-create guard so it picks up the new config
    guard = new JwtAuthGuard(reflector, configService);

    // Patch the private isBlacklisted method to return true
    jest
      .spyOn(guard as unknown as { isBlacklisted: (t: string) => Promise<boolean> }, 'isBlacklisted')
      .mockResolvedValue(true);

    const token = makeToken({ sub: 'user-1' });
    const ctx = makeContext(token);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
