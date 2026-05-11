import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import {
  MST_VERIFICATION_ADAPTER,
  MSTVerificationAdapter,
} from './adapters/mst-verification.adapter';
import { OnboardingService } from './onboarding/onboarding.service';
import {
  RegistrationStatus,
  TenantRegistration,
} from './schemas/tenant-registration.schema';
import { Tenant, TenantPlan, TenantStatus } from './schemas/tenant.schema';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let configService: jest.Mocked<ConfigService>;

  const tenantModel = {
    exists: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const registrationModel = {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const rabbitMQService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const onboardingService = {
    initializeTenant: jest.fn().mockResolvedValue({
      bucketName: 'tenant-1',
      adminUserEmail: 'admin@acme.vn',
    }),
  };

  const mstAdapter: jest.Mocked<MSTVerificationAdapter> = {
    lookupByTaxCode: jest.fn(),
    verifyEmailMatch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REQUIRE_MANUAL_REVIEW') {
                return 'false';
              }

              return undefined;
            }),
          },
        },
        {
          provide: RabbitMQService,
          useValue: rabbitMQService,
        },
        {
          provide: OnboardingService,
          useValue: onboardingService,
        },
        {
          provide: getModelToken(Tenant.name),
          useValue: tenantModel,
        },
        {
          provide: getModelToken(TenantRegistration.name),
          useValue: registrationModel,
        },
        {
          provide: MST_VERIFICATION_ADAPTER,
          useValue: mstAdapter,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('register success', async () => {
    tenantModel.exists.mockResolvedValue(null);
    registrationModel.exists.mockResolvedValue(null);
    registrationModel.create.mockResolvedValue({
      id: 'reg-1',
      activationTokenExpiresAt: new Date('2026-05-11T12:30:00.000Z'),
      status: RegistrationStatus.PENDING_EMAIL_ACTIVATION,
    });

    const result = await service.register({
      companyName: 'ACME',
      taxCode: '0123456789',
      email: 'admin@acme.vn',
      subdomain: 'acme',
    });

    expect(result.success).toBe(true);
    expect(result.data.registrationId).toBe('reg-1');
    expect(result.data).not.toHaveProperty('activationToken');
    expect(registrationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taxCode: '0123456789',
        subdomain: 'acme',
      }),
    );
  });

  it('register duplicate tax code returns 409', async () => {
    tenantModel.exists.mockResolvedValue({ _id: 'tenant-1' });
    registrationModel.exists.mockResolvedValue(null);

    await expect(
      service.register({
        companyName: 'ACME',
        taxCode: '0123456789',
        email: 'admin@acme.vn',
        subdomain: 'acme',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('activate token expired returns 410', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    registrationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: 'reg-1',
        status: RegistrationStatus.PENDING_EMAIL_ACTIVATION,
        activationTokenExpiresAt: new Date(Date.now() - 1000),
        save,
      }),
    });

    await expect(service.activateRegistration('token-1')).rejects.toThrow(
      GoneException,
    );
    expect(save).toHaveBeenCalled();
  });

  it('verify tax code invalid format returns 400', async () => {
    await expect(
      service.verifyTaxCode({
        taxCode: 'abc',
        email: 'admin@acme.vn',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('verify tax code requires registration to exist', async () => {
    registrationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.verifyTaxCode({
        taxCode: '0123456789',
        email: 'admin@acme.vn',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('verify tax code requires EMAIL_VERIFIED registration state', async () => {
    registrationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        status: RegistrationStatus.PENDING_EMAIL_ACTIVATION,
      }),
    });

    await expect(
      service.verifyTaxCode({
        taxCode: '0123456789',
        email: 'admin@acme.vn',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('verify tax code updates registration when state is valid', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    registrationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        taxCode: '0123456789',
        email: 'admin@acme.vn',
        status: RegistrationStatus.EMAIL_VERIFIED,
        save,
      }),
    });
    mstAdapter.lookupByTaxCode.mockResolvedValue({
      companyName: 'ACME',
      address: 'HN',
      status: 'ACTIVE',
      registeredEmail: 'admin@acme.vn',
      registrationDate: new Date('2024-01-01T00:00:00.000Z'),
    });
    mstAdapter.verifyEmailMatch.mockResolvedValue(true);

    const result = await service.verifyTaxCode({
      taxCode: '0123456789',
      email: 'admin@acme.vn',
    });

    expect(result.success).toBe(true);
    expect(save).toHaveBeenCalled();
  });

  it('complete onboarding requires taxVerified to be true', async () => {
    registrationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        id: 'reg-3',
        taxCode: '0123456789',
        subdomain: 'acme',
        email: 'tax-6789@example.vn',
        taxVerified: false,
        status: RegistrationStatus.EMAIL_VERIFIED,
      }),
    });

    await expect(
      service.completeOnboarding({ registrationId: 'reg-3' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('complete onboarding with manual review true sets PENDING_VERIFICATION', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'REQUIRE_MANUAL_REVIEW') {
        return 'true';
      }

      return undefined;
    });

    const registrationSave = jest.fn().mockResolvedValue(undefined);
    registrationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        id: 'reg-1',
        taxCode: '0123456789',
        subdomain: 'acme',
        email: 'tax-6789@example.vn',
        taxVerified: true,
        taxInfo: { companyName: 'ACME' },
        status: RegistrationStatus.EMAIL_VERIFIED,
        save: registrationSave,
      }),
    });
    tenantModel.exists.mockResolvedValue(null);
    tenantModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });
    tenantModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      id: 'tenant-1',
      companyName: 'ACME',
      subdomain: 'acme',
      status: TenantStatus.PENDING_VERIFICATION,
      plan: TenantPlan.TRIAL,
      adminEmail: 'tax-6789@example.vn',
      trialEndsAt: new Date(),
    });

    const result = await service.completeOnboarding({ registrationId: 'reg-1' });

    expect(result.data.status).toBe(TenantStatus.PENDING_VERIFICATION);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.registered',
      expect.any(Object),
    );
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.created',
      expect.any(Object),
    );
  });

  it('complete onboarding with manual review false sets TRIAL', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'REQUIRE_MANUAL_REVIEW') {
        return 'false';
      }

      return undefined;
    });

    registrationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        id: 'reg-2',
        taxCode: '0123456789111',
        subdomain: 'acme-2',
        email: 'tax-9111@example.vn',
        taxVerified: true,
        taxInfo: { companyName: 'ACME 2' },
        status: RegistrationStatus.EMAIL_VERIFIED,
        save: jest.fn().mockResolvedValue(undefined),
      }),
    });
    tenantModel.exists.mockResolvedValue(null);
    tenantModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });
    tenantModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      id: 'tenant-2',
      companyName: 'ACME 2',
      subdomain: 'acme-2',
      status: TenantStatus.TRIAL,
      plan: TenantPlan.TRIAL,
      adminEmail: 'tax-9111@example.vn',
      trialEndsAt: new Date(),
    });

    const result = await service.completeOnboarding({
      registrationId: 'reg-2',
      companyName: 'ACME 2',
    });

    expect(result.data.status).toBe(TenantStatus.TRIAL);
  });

  it('suspend then activate works, activate TERMINATED rejected', async () => {
    const tenantTerminated = {
      id: 'tenant-x',
      isDeleted: false,
      status: TenantStatus.TERMINATED,
      save: jest.fn(),
    };

    tenantModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(tenantTerminated),
    });

    await expect(
      service.activateTenant('tenant-x', {
        tenantId: 'tenant-x',
      } as Express.User),
    ).rejects.toThrow(UnprocessableEntityException);

    const suspended = {
      id: 'tenant-3',
      isDeleted: false,
      status: TenantStatus.SUSPENDED,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const active = {
      id: 'tenant-3',
      adminEmail: 'admin@acme.vn',
      isDeleted: false,
      status: TenantStatus.ACTIVE,
      save: jest.fn().mockResolvedValue(undefined),
    };

    tenantModel.findById
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(active),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(suspended),
      });

    const suspendedResult = await service.suspendTenant(
      'tenant-3',
      {
        tenantId: 'tenant-3',
      } as Express.User,
    );

    expect(suspendedResult.data.status).toBe(TenantStatus.SUSPENDED);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.suspended',
      expect.any(Object),
    );

    const activatedResult = await service.activateTenant(
      'tenant-3',
      {
        tenantId: 'tenant-3',
      } as Express.User,
    );

    expect(activatedResult.data.status).toBe(TenantStatus.ACTIVE);
  });

  it('deleteTenant soft deletes and terminates tenant', async () => {
    const tenant = {
      isDeleted: false,
      status: TenantStatus.ACTIVE,
      save: jest.fn().mockResolvedValue(undefined),
    };
    tenantModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(tenant),
    });

    await service.deleteTenant('tenant-5', {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(tenant.isDeleted).toBe(true);
    expect(tenant.status).toBe(TenantStatus.TERMINATED);
    expect(tenant.save).toHaveBeenCalled();
  });

  it('updateTenantPlan requires super admin and updates plan', async () => {
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          id: 'tenant-6',
          plan: TenantPlan.BUSINESS,
        }),
      }),
    });

    const result = await service.updateTenantPlan(
      'tenant-6',
      { roles: ['SUPER_ADMIN'] } as Express.User,
      TenantPlan.BUSINESS,
    );

    expect(result.data.plan).toBe(TenantPlan.BUSINESS);
  });
});
