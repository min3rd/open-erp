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

  it('preserves query parameters in forwarded request', async () => {
    const req: any = {
      originalUrl: '/api/v1/users/list?page=1&limit=10',
      method: 'GET',
      body: undefined,
      header: () => undefined,
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: { get: () => null },
      json: async () => ({ users: [] }),
      text: async () => '',
    } as any);

    await service.forwardRequest(req, 'users/list');

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('page=1&limit=10');
  });

  it('handles JSON responses correctly', async () => {
    const req: any = {
      originalUrl: '/api/v1/auth/verify',
      method: 'POST',
      body: { token: 'abc' },
      header: () => 'application/json',
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ valid: true }),
      text: async () => '',
    } as any);

    const result = await service.forwardRequest(req, 'auth/verify');

    expect(result.contentType).toBe('application/json');
    expect(result.data).toEqual({ valid: true });
  });

  it('handles text responses correctly', async () => {
    const req: any = {
      originalUrl: '/api/v1/users/export',
      method: 'GET',
      body: undefined,
      header: () => 'text/plain',
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: { get: () => 'text/plain' },
      json: async () => {
        throw new Error('not json');
      },
      text: async () => 'export data',
    } as any);

    const result = await service.forwardRequest(req, 'users/export');

    expect(result.contentType).toBe('text/plain');
    expect(result.data).toBe('export data');
  });

  it('does not include body for GET/HEAD requests', async () => {
    const req: any = {
      originalUrl: '/api/v1/users/profile',
      method: 'GET',
      body: { some: 'body' },
      header: () => 'application/json',
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ profile: {} }),
      text: async () => '',
    } as any);

    await service.forwardRequest(req, 'users/profile');

    const callArgs = fetchMock.mock.calls[0] as any[];
    expect(callArgs[1].body).toBeUndefined();
  });

  it('includes body for non-GET/HEAD requests', async () => {
    const req: any = {
      originalUrl: '/api/v1/users/create',
      method: 'POST',
      body: { name: 'John' },
      header: () => 'application/json',
      tenantId: 'tenant-1',
      requestId: 'req-1',
    };

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: '1' }),
      text: async () => '',
    } as any);

    await service.forwardRequest(req, 'users/create');

    const callArgs = fetchMock.mock.calls[0] as any[];
    expect(callArgs[1].body).toEqual(JSON.stringify({ name: 'John' }));
  });
});
