import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController', () => {
  let controller: TenantController;

  const tenantService = {
    listTenants: jest.fn(),
    getMyTenant: jest.fn(),
    updateMySettings: jest.fn(),
    getMySettings: jest.fn(),
    getTenantById: jest.fn(),
    updateTenant: jest.fn(),
    deleteTenant: jest.fn(),
    updateTenantPlan: jest.fn(),
    approveTenant: jest.fn(),
    activateTenant: jest.fn(),
    suspendTenant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: tenantService,
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    jest.clearAllMocks();
  });

  it('listTenants delegates query and user context', async () => {
    tenantService.listTenants.mockResolvedValue({ success: true, data: [] });

    const req = {
      user: { roles: ['SUPER_ADMIN'] },
    } as never;
    const query = {
      page: 1,
      limit: 20,
    } as never;

    const result = await controller.listTenants(query, req);

    expect(tenantService.listTenants).toHaveBeenCalledWith(query, {
      roles: ['SUPER_ADMIN'],
    });
    expect(result.success).toBe(true);
  });

  it('getMySettings delegates tenant context from request', async () => {
    tenantService.getMySettings.mockResolvedValue({ success: true, data: {} });

    const req = {
      tenantId: 'tenant-1',
      user: { tenantId: 'tenant-1' },
    } as never;

    const result = await controller.getMySettings(req);

    expect(tenantService.getMySettings).toHaveBeenCalledWith('tenant-1', {
      tenantId: 'tenant-1',
    });
    expect(result.success).toBe(true);
  });

  it('deleteTenant delegates to service', async () => {
    tenantService.deleteTenant.mockResolvedValue(undefined);

    const req = {
      user: { roles: ['SUPER_ADMIN'] },
    } as never;

    await controller.deleteTenant('tenant-1', req);

    expect(tenantService.deleteTenant).toHaveBeenCalledWith('tenant-1', {
      roles: ['SUPER_ADMIN'],
    });
  });

  it('updateTenantPlan delegates to service', async () => {
    tenantService.updateTenantPlan.mockResolvedValue({
      success: true,
      data: { id: 'tenant-1', plan: 'BUSINESS' },
    });

    const req = {
      user: { roles: ['SUPER_ADMIN'] },
    } as never;

    const result = await controller.updateTenantPlan(
      'tenant-1',
      req,
      { plan: 'BUSINESS' } as never,
    );

    expect(tenantService.updateTenantPlan).toHaveBeenCalledWith(
      'tenant-1',
      { roles: ['SUPER_ADMIN'] },
      'BUSINESS',
    );
    expect(result.success).toBe(true);
  });
});
