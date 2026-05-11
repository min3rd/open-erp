import { Test, TestingModule } from '@nestjs/testing';
import { TenantRegistrationController } from './tenant-registration.controller';
import { TenantService } from './tenant.service';

describe('TenantRegistrationController', () => {
  let controller: TenantRegistrationController;

  const tenantService = {
    register: jest.fn(),
    activateRegistration: jest.fn(),
    verifyTaxCode: jest.fn(),
    completeOnboarding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantRegistrationController],
      providers: [
        {
          provide: TenantService,
          useValue: tenantService,
        },
      ],
    }).compile();

    controller = module.get<TenantRegistrationController>(TenantRegistrationController);
    jest.clearAllMocks();
  });

  it('register delegates to service', async () => {
    tenantService.register.mockResolvedValue({ success: true, data: { id: '1' } });

    const dto = {
      companyName: 'ACME',
      taxCode: '0123456789',
      email: 'admin@acme.vn',
      subdomain: 'acme',
    };

    const result = await controller.register(dto);

    expect(tenantService.register).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
  });

  it('activateRegistration delegates token', async () => {
    tenantService.activateRegistration.mockResolvedValue({
      success: true,
      data: { status: 'EMAIL_VERIFIED' },
    });

    const result = await controller.activateRegistration('token-1');

    expect(tenantService.activateRegistration).toHaveBeenCalledWith('token-1');
    expect(result.success).toBe(true);
  });
});