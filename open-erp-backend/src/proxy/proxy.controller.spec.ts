import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

describe('ProxyController', () => {
  const proxyService = {
    forwardRequest: jest.fn(),
  } as unknown as ProxyService;

  const controller = new ProxyController(proxyService);

  const req = {
    method: 'GET',
    originalUrl: '/api/v1/auth/me',
  } as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data when upstream status is successful', async () => {
    (proxyService.forwardRequest as jest.Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
      contentType: 'application/json',
    });

    const result = await controller.proxy(req, 'auth/me');

    expect(result).toEqual({ ok: true });
  });

  it('throws HttpException with object body for upstream error object', async () => {
    (proxyService.forwardRequest as jest.Mock).mockResolvedValue({
      status: 422,
      data: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: {
          key: 'error.business.invalid_state',
          data: { state: 'locked' },
        },
      },
      contentType: 'application/json',
    });

    await expect(controller.proxy(req, 'auth/me')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('maps primitive payload to safe HttpException body', async () => {
    (proxyService.forwardRequest as jest.Mock).mockResolvedValue({
      status: 500,
      data: 123,
      contentType: 'text/plain',
    });

    try {
      await controller.proxy(req, 'auth/me');
      fail('expected HttpException');
    } catch (error) {
      const exception = error as HttpException;
      expect(exception.getResponse()).toEqual({
        code: 'UPSTREAM_ERROR',
        message: {
          key: 'error.upstream.invalid_payload',
          data: { payloadType: 'number' },
        },
      });
    }
  });
});
