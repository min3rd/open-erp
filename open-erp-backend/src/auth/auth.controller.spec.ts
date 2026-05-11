import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('login sets refresh token cookie', async () => {
    authService.login.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenExpiresAt: new Date('2026-05-18T10:00:00.000Z'),
        expiresIn: 900,
        mfaRequired: false,
        user: { id: 'user-1', email: 'admin@acme.vn', roles: ['TENANT_ADMIN'] },
      },
    });

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    await controller.login(
      {
        tenantId: 'tenant-1',
        email: 'admin@acme.vn',
        password: 'Password@123',
      },
      '127.0.0.1',
      'jest',
      res,
    );

    expect(authService.login).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('refreshToken prefers cookie token over body and rotates cookie', async () => {
    authService.refreshToken.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'rotated-refresh-token',
        refreshTokenExpiresAt: new Date('2026-05-18T10:00:00.000Z'),
        expiresIn: 900,
      },
    });

    const req = {
      header: jest.fn((name: string) =>
        name === 'cookie'
          ? 'refreshToken=cookie-token; other=value'
          : undefined,
      ),
    } as unknown as Request;
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.refreshToken(
      req,
      { refreshToken: 'body-token' },
      '127.0.0.1',
      'jest',
      res,
    );

    expect(authService.refreshToken).toHaveBeenCalledWith('cookie-token', {
      ip: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rotated-refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
    expect(result.success).toBe(true);
  });

  it('refreshToken falls back to request body when cookie is absent', async () => {
    authService.refreshToken.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'rotated-refresh-token',
        refreshTokenExpiresAt: new Date('2026-05-18T10:00:00.000Z'),
        expiresIn: 900,
      },
    });

    const req = {
      header: jest.fn(() => undefined),
    } as unknown as Request;

    await controller.refreshToken(
      req,
      { refreshToken: 'body-token' },
      '127.0.0.1',
      'jest',
      { cookie: jest.fn() } as unknown as Response,
    );

    expect(authService.refreshToken).toHaveBeenCalledWith('body-token', {
      ip: '127.0.0.1',
      userAgent: 'jest',
    });
  });

  it('refreshToken rejects when neither cookie nor body token exists', async () => {
    const req = {
      header: jest.fn(() => undefined),
    } as unknown as Request;

    await expect(
      controller.refreshToken(req, {}, '127.0.0.1', 'jest', {
        cookie: jest.fn(),
      } as unknown as Response),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logout clears refresh token cookie', async () => {
    authService.logout.mockResolvedValue({
      success: true,
      data: { loggedOut: true },
    });

    const req = {
      user: {
        sub: 'user-1',
        tenantId: 'tenant-1',
        email: 'admin@acme.vn',
        roles: ['TENANT_ADMIN'],
        jti: 'jti-1',
        iat: 100,
        exp: 200,
      },
      header: jest.fn((name: string) =>
        name === 'cookie' ? 'refreshToken=cookie-token' : undefined,
      ),
    } as unknown as Request;
    const res = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    await controller.logout(req, undefined, '127.0.0.1', 'jest', res);

    expect(authService.logout).toHaveBeenCalledWith(req.user, {
      refreshToken: 'cookie-token',
      ip: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('forgotPassword sends password reset OTP', async () => {
    authService.forgotPassword.mockResolvedValue({
      success: true,
      data: { otpSent: true },
    });

    const result = await controller.forgotPassword(
      {
        tenantId: 'tenant-1',
        email: 'user@acme.vn',
      },
      '127.0.0.1',
      'jest',
    );

    expect(authService.forgotPassword).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        email: 'user@acme.vn',
      },
      {
        ip: '127.0.0.1',
        userAgent: 'jest',
      },
    );
    expect(result.success).toBe(true);
  });

  it('resetPassword resets password with OTP', async () => {
    authService.resetPassword.mockResolvedValue({
      success: true,
      data: { passwordReset: true },
    });

    const result = await controller.resetPassword({
      tenantId: 'tenant-1',
      email: 'user@acme.vn',
      otp: '123456',
      newPassword: 'NewPassword@123',
    });

    expect(authService.resetPassword).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      email: 'user@acme.vn',
      otp: '123456',
      newPassword: 'NewPassword@123',
    });
    expect(result.success).toBe(true);
  });

  it('me returns current user profile', async () => {
    authService.me.mockResolvedValue({
      success: true,
      data: {
        id: 'user-1',
        email: 'admin@acme.vn',
        roles: ['TENANT_ADMIN'],
      },
    });

    const req = {
      user: {
        sub: 'user-1',
        tenantId: 'tenant-1',
        email: 'admin@acme.vn',
        roles: ['TENANT_ADMIN'],
        jti: 'jti-1',
        iat: 100,
        exp: 200,
      },
    } as unknown as Request;

    const result = await controller.me(req);

    expect(authService.me).toHaveBeenCalledWith(req.user);
    expect(result.success).toBe(true);
  });
});
