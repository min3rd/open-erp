import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TenantQuotaMiddleware } from './tenant-quota.middleware';
import { TenantService } from '../../tenant/tenant.service';
import { Request, Response, NextFunction } from 'express';

describe('TenantQuotaMiddleware', () => {
  let middleware: TenantQuotaMiddleware;
  let tenantService: jest.Mocked<TenantService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQuotaMiddleware,
        {
          provide: TenantService,
          useValue: {
            enforceApiQuota: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantQuotaMiddleware>(TenantQuotaMiddleware);
    tenantService = module.get(TenantService) as jest.Mocked<TenantService>;
  });

  describe('quota enforcement', () => {
    it('enforces API quota for authenticated tenant', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users',
      );
      expect(next).toHaveBeenCalled();
    });

    it('increments API counter per request', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledTimes(1);

      // Call again
      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledTimes(2);
    });

    it('throws TooManyRequestsException when quota exceeded', async () => {
      const quotaError = new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          message: 'API calls limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
      tenantService.enforceApiQuota.mockRejectedValue(quotaError);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        HttpException,
      );

      expect(next).not.toHaveBeenCalled();
    });

    it('catches non-HttpException errors and converts to INTERNAL_ERROR', async () => {
      tenantService.enforceApiQuota.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('path exemptions', () => {
    it('exempts /api/v1/auth endpoints from quota', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/auth/login',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('exempts /api/v1/auth/refresh-token', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/auth/refresh-token',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('exempts /api/v1/auth/forgot-password', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/auth/forgot-password',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
    });

    it('exempts /api/v1/auth/mfa/challenge', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/auth/mfa/challenge',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
    });

    it('exempts /api/v1/health endpoints from quota', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/health',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('exempts /api/v1/health/liveness', async () => {
      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/health/liveness',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
    });
  });

  describe('tenant context handling', () => {
    it('skips quota check when tenantId is missing', async () => {
      const req = {
        tenantId: undefined,
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('skips quota check when tenantId is null', async () => {
      const req = {
        tenantId: null,
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('skips quota check when tenantId is empty string', async () => {
      const req = {
        tenantId: '',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('route-specific quota checks', () => {
    it('enforces quota on POST /api/v1/users (user creation)', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users',
      );
    });

    it('enforces quota on GET /api/v1/users (list users)', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users',
      );
    });

    it('enforces quota on GET /api/v1/users/:id', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users/user-123',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users/user-123',
      );
    });

    it('enforces quota on file upload routes', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users/user-123/avatar',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users/user-123/avatar',
      );
    });

    it('enforces quota on /api/v1/departments (department management)', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/departments',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/departments',
      );
    });

    it('enforces quota on /api/v1/tenants endpoints', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/tenants/me',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/tenants/me',
      );
    });
  });

  describe('error handling', () => {
    it('re-throws HttpException as-is', async () => {
      const forbiddenError = new HttpException(
        {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
        HttpStatus.FORBIDDEN,
      );
      tenantService.enforceApiQuota.mockRejectedValue(forbiddenError);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        forbiddenError,
      );
    });

    it('wraps non-HttpException errors in INTERNAL_ERROR', async () => {
      tenantService.enforceApiQuota.mockRejectedValue(
        new TypeError('Cannot read property of undefined'),
      );

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      try {
        await middleware.use(req, res, next);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    it('continues to next middleware even after successful quota check', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('multi-tenancy isolation', () => {
    it('enforces separate quotas for different tenants', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const res = {} as Response;
      const next = jest.fn();

      // Tenant 1 request
      const req1 = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;
      await middleware.use(req1, res, next);

      // Tenant 2 request
      const req2 = {
        tenantId: 'tenant-2',
        path: '/api/v1/users',
      } as unknown as Request;
      await middleware.use(req2, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenNthCalledWith(
        1,
        'tenant-1',
        '/api/v1/users',
      );
      expect(tenantService.enforceApiQuota).toHaveBeenNthCalledWith(
        2,
        'tenant-2',
        '/api/v1/users',
      );
    });

    it('quota limit does not affect other tenants', async () => {
      const quotaError = new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          message: 'Tenant 1 quota exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );

      // Tenant 1 hits quota limit
      tenantService.enforceApiQuota
        .mockRejectedValueOnce(quotaError)
        .mockResolvedValueOnce(undefined);

      const res = {} as Response;
      const next = jest.fn();

      const req1 = {
        tenantId: 'tenant-1',
        path: '/api/v1/users',
      } as unknown as Request;

      await expect(middleware.use(req1, res, next)).rejects.toThrow(
        quotaError,
      );

      // Tenant 2 should still work
      const req2 = {
        tenantId: 'tenant-2',
        path: '/api/v1/users',
      } as unknown as Request;

      await expect(middleware.use(req2, res, next)).resolves.toBeUndefined();
      expect(next).toHaveBeenLastCalledWith();
    });
  });

  describe('request tracing', () => {
    it('passes full request path to enforceApiQuota', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users/user-123/avatar?size=large',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users/user-123/avatar?size=large',
      );
    });

    it('handles query parameters in path', async () => {
      tenantService.enforceApiQuota.mockResolvedValue(undefined);

      const req = {
        tenantId: 'tenant-1',
        path: '/api/v1/users?page=2&limit=50',
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(tenantService.enforceApiQuota).toHaveBeenCalledWith(
        'tenant-1',
        '/api/v1/users?page=2&limit=50',
      );
    });
  });
});
