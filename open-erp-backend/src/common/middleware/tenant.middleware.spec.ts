import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  const middleware = new TenantMiddleware();

  it('extracts tenantId from JWT payload first', () => {
    const req: any = {
      user: { tenantId: 'tenant-jwt' },
      header: jest.fn(),
      hostname: 'acme.openErp.vn',
      headers: {},
    };

    middleware.use(req, {} as any, jest.fn());

    expect(req.tenantId).toBe('tenant-jwt');
  });

  it('falls back to X-Tenant-ID header', () => {
    const req: any = {
      user: undefined,
      header: (name: string) =>
        name.toLowerCase() === 'x-tenant-id' ? 'tenant-header' : undefined,
      hostname: 'api.openErp.vn',
      headers: {},
    };

    middleware.use(req, {} as any, jest.fn());

    expect(req.tenantId).toBe('tenant-header');
  });

  it('extracts tenantId from subdomain when JWT/header are missing', () => {
    const req: any = {
      user: undefined,
      header: () => undefined,
      hostname: 'acme.openErp.vn',
      headers: {},
    };

    middleware.use(req, {} as any, jest.fn());

    expect(req.tenantId).toBe('acme');
  });
});
