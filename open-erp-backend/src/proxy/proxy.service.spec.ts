import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  const service = new ProxyService();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws NotFoundException when route prefix is not mapped', async () => {
    const req: any = {
      originalUrl: '/api/v1/unknown/path',
      method: 'GET',
      body: undefined,
      header: () => undefined,
      tenantId: undefined,
      requestId: 'req-1',
    };

    await expect(service.forwardRequest(req, 'unknown/path')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forwards request to mapped upstream and returns parsed response', async () => {
    const req: any = {
      originalUrl: '/api/v1/auth/login?foo=bar',
      method: 'POST',
      body: { username: 'u' },
      header: (name: string) => {
        if (name === 'content-type') return 'application/json';
        if (name === 'authorization') return 'Bearer token';
        return undefined;
      },
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: {
        get: (header: string) =>
          header.toLowerCase() === 'content-type'
            ? 'application/json'
            : null,
      },
      json: async () => ({ ok: true }),
      text: async () => '',
    } as any);

    const result = await service.forwardRequest(req, 'auth/login');

    expect(fetchMock).toHaveBeenCalled();
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ ok: true });
  });

  it('throws BadGatewayException when upstream request fails', async () => {
    const req: any = {
      originalUrl: '/api/v1/auth/login',
      method: 'GET',
      body: undefined,
      header: () => undefined,
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    jest.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('network down'));

    await expect(service.forwardRequest(req, 'auth/login')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
