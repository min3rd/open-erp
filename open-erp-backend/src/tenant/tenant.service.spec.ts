import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
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
    updateOne: jest.fn(),
  };

  const registrationModel = {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const subscriptionPlanModel = {
    updateOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const tenantUsageHistoryModel = {
    updateOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
    find: jest.fn(),
  };

  const userModel = {
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
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
          provide: getModelToken('SubscriptionPlan'),
          useValue: subscriptionPlanModel,
        },
        {
          provide: getModelToken('TenantUsageHistory'),
          useValue: tenantUsageHistoryModel,
        },
        {
          provide: getModelToken('User'),
          useValue: userModel,
        },
        {
          provide: MST_VERIFICATION_ADAPTER,
          useValue: mstAdapter,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    configService = module.get(ConfigService);

    (tenantModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    (tenantModel.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    (subscriptionPlanModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    (tenantUsageHistoryModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

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

    const result = await service.completeOnboarding({
      registrationId: 'reg-1',
    });

    expect(result.data.status).toBe(TenantStatus.PENDING_VERIFICATION);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.registered',
      expect.any(Object),
    );
    // tenant.created must NOT be published here — it is deferred to finalizeWizard()
    expect(rabbitMQService.publish).not.toHaveBeenCalledWith(
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

    const suspendedResult = await service.suspendTenant('tenant-3', {
      tenantId: 'tenant-3',
    } as Express.User);

    expect(suspendedResult.data.status).toBe(TenantStatus.SUSPENDED);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.suspended',
      expect.any(Object),
    );

    const activatedResult = await service.activateTenant('tenant-3', {
      tenantId: 'tenant-3',
    } as Express.User);

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

  it('finalizeWizard publishes tenant.created for existing tenant', async () => {
    tenantModel.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId('6642a0000000000000000001'),
          plan: TenantPlan.TRIAL,
          adminEmail: 'admin@acme.vn',
          isDeleted: false,
        }),
      }),
    });

    const result = await service.finalizeWizard('6642a0000000000000000001');

    expect(result.success).toBe(true);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'tenant.created',
      expect.objectContaining({ plan: TenantPlan.TRIAL }),
    );
  });

  it('finalizeWizard throws NotFoundException for missing tenant', async () => {
    tenantModel.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.finalizeWizard('000000000000000000000000'),
    ).rejects.toThrow(NotFoundException);
  });

  // ——————————————————————————————————————————————————
  // Additional tests for > 80% coverage
  // ——————————————————————————————————————————————————

  it('getTenantById returns tenant for super admin', async () => {
    const tenantData = {
      _id: new Types.ObjectId('64b000000000000000000001'),
      id: '64b000000000000000000001',
      isDeleted: false,
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.TRIAL,
    };
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(tenantData),
      }),
    });

    const result = await service.getTenantById('64b000000000000000000001', {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(result.success).toBe(true);
  });

  it('getTenantById throws NotFoundException for missing tenant', async () => {
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getTenantById('64b000000000000000000001', {
        roles: ['SUPER_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(NotFoundException);
  });

  it('listTenants returns paginated results for super admin', async () => {
    const tenantList = [{ id: 'tenant-1', isDeleted: false }];
    tenantModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(tenantList),
            }),
          }),
        }),
      }),
    });
    tenantModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const result = await service.listTenants(
      { page: 1, limit: 20 } as any,
      { roles: ['SUPER_ADMIN'] } as Express.User,
    );

    expect(result.success).toBe(true);
    expect(result.pagination.total).toBe(1);
  });

  it('listTenants filters by tenantId for non-super-admin', async () => {
    tenantModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    tenantModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    const result = await service.listTenants(
      { page: 1, limit: 20, status: TenantStatus.ACTIVE } as any,
      { tenantId: '64b000000000000000000001', roles: ['TENANT_ADMIN'] } as Express.User,
    );

    expect(result.success).toBe(true);
  });

  it('updateTenant updates and returns tenant', async () => {
    const updated = {
      _id: new Types.ObjectId('64b000000000000000000001'),
      id: '64b000000000000000000001',
      isDeleted: false,
    };
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      }),
    });

    const result = await service.updateTenant(
      '64b000000000000000000001',
      { roles: ['SUPER_ADMIN'] } as Express.User,
      { companyName: 'Updated Corp' },
    );

    expect(result.success).toBe(true);
  });

  it('updateTenant throws NotFoundException when tenant not found', async () => {
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateTenant(
        '64b000000000000000000001',
        { roles: ['SUPER_ADMIN'] } as Express.User,
        { companyName: 'Updated' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('approveTenant changes status to TRIAL', async () => {
    const tenant = {
      id: '64b000000000000000000001',
      isDeleted: false,
      status: TenantStatus.PENDING_VERIFICATION,
      save: jest.fn().mockResolvedValue(undefined),
    };
    tenantModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(tenant),
    });

    const result = await service.approveTenant('64b000000000000000000001', {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(result.data.status).toBe(TenantStatus.TRIAL);
    expect(tenant.save).toHaveBeenCalled();
  });

  it('approveTenant throws when status is not PENDING_VERIFICATION', async () => {
    const tenant = {
      id: '64b000000000000000000001',
      isDeleted: false,
      status: TenantStatus.ACTIVE,
      save: jest.fn(),
    };
    tenantModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(tenant),
    });

    await expect(
      service.approveTenant('64b000000000000000000001', {
        roles: ['SUPER_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('approveTenant throws NotFoundException when tenant missing', async () => {
    tenantModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.approveTenant('64b000000000000000000001', {
        roles: ['SUPER_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(NotFoundException);
  });

  it('enforceApiQuota blocks PENDING_VERIFICATION tenants', async () => {
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId('64b000000000000000000001'),
            status: TenantStatus.PENDING_VERIFICATION,
            isDeleted: false,
          }),
        }),
      }),
    });

    await expect(
      service.enforceApiQuota('64b000000000000000000001', '/api/test'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('enforceApiQuota blocks TRIAL tenants with expired trial', async () => {
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId('64b000000000000000000001'),
            status: TenantStatus.TRIAL,
            trialEndsAt: new Date(Date.now() - 1000),
            plan: TenantPlan.TRIAL,
            isDeleted: false,
          }),
        }),
      }),
    });
    tenantModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });

    await expect(
      service.enforceApiQuota('64b000000000000000000001', '/api/test'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('enforceApiQuota allows ACTIVE tenant under quota', async () => {
    const tenantId = '64b000000000000000000001';
    tenantModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(tenantId),
              status: TenantStatus.ACTIVE,
              plan: TenantPlan.TRIAL,
              quotas: { maxApiCallsPerDay: 1000 },
              isDeleted: false,
              usageStats: { usedStorageBytes: 0 },
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            usageStats: { apiCallsToday: 5 },
          }),
        }),
      });
    tenantUsageHistoryModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(3),
    });

    await expect(
      service.enforceApiQuota(tenantId, '/api/test'),
    ).resolves.toBeUndefined();
  });

  it('enforceApiQuota throws when quota exceeded', async () => {
    const tenantId = '64b000000000000000000001';
    tenantModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(tenantId),
              status: TenantStatus.ACTIVE,
              plan: TenantPlan.TRIAL,
              quotas: { maxApiCallsPerDay: 1000 },
              isDeleted: false,
              usageStats: {},
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            usageStats: { apiCallsToday: 1001 },
          }),
        }),
      });

    await expect(
      service.enforceApiQuota(tenantId, '/api/test'),
    ).rejects.toThrow(HttpException);
  });

  it('enforceApiQuota skips deleted tenants', async () => {
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    await expect(
      service.enforceApiQuota('64b000000000000000000001', '/api/test'),
    ).resolves.toBeUndefined();
  });

  it('suspendExpiredTrials processes expired tenants', async () => {
    const expiredTenants = [
      { _id: new Types.ObjectId('64b000000000000000000001'), adminEmail: 'a@test.com' },
      { _id: new Types.ObjectId('64b000000000000000000002'), adminEmail: 'b@test.com' },
    ];
    tenantModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(expiredTenants),
        }),
      }),
    });
    tenantModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });
    rabbitMQService.publish.mockResolvedValue(undefined);

    await service.suspendExpiredTrials();

    expect(tenantModel.updateOne).toHaveBeenCalledTimes(2);
  });

  it('updateMySettings updates tenant settings', async () => {
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          settings: { mfaRequired: true },
        }),
      }),
    });

    const result = await service.updateMySettings(
      '64b000000000000000000001',
      undefined,
      { mfaRequired: true } as any,
    );

    expect(result.success).toBe(true);
    expect(result.data.mfaRequired).toBe(true);
  });

  it('updateMySettings throws NotFoundException when tenant not found', async () => {
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateMySettings(
        '64b000000000000000000001',
        undefined,
        {} as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('getMySettings returns tenant settings', async () => {
    tenantModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            settings: { mfaRequired: false },
          }),
        }),
      }),
    });

    const result = await service.getMySettings('64b000000000000000000001', undefined);

    expect(result.success).toBe(true);
    expect(result.data.mfaRequired).toBe(false);
  });

  it('getMySettings throws NotFoundException when tenant not found', async () => {
    tenantModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    await expect(
      service.getMySettings('64b000000000000000000001', undefined),
    ).rejects.toThrow(NotFoundException);
  });

  it('listSubscriptionPlans returns active plans', async () => {
    subscriptionPlanModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { code: TenantPlan.TRIAL, name: 'Trial', price: 0 },
            { code: TenantPlan.STARTER, name: 'Starter', price: 500000 },
          ]),
        }),
      }),
    });

    const result = await service.listSubscriptionPlans();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('updateTenantSubscription throws when plan not found', async () => {
    subscriptionPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateTenantSubscription(
        '64b000000000000000000001',
        { roles: ['SUPER_ADMIN'] } as Express.User,
        'INVALID_PLAN',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateTenantSubscription updates plan and quotas', async () => {
    const plan = {
      code: TenantPlan.BUSINESS,
      quotas: { maxUsers: 100, maxStorageBytes: null, maxApiCallsPerDay: 100000 },
      isActive: true,
    };
    subscriptionPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(plan),
      }),
    });
    tenantModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId('64b000000000000000000001'),
          plan: TenantPlan.BUSINESS,
        }),
      }),
    });

    const result = await service.updateTenantSubscription(
      '64b000000000000000000001',
      { roles: ['SUPER_ADMIN'] } as Express.User,
      'BUSINESS',
    );

    expect(result.success).toBe(true);
  });

  it('getTenantUsage returns usage data', async () => {
    const tenantId = '64b000000000000000000001';
    const tenantData = {
      _id: new Types.ObjectId(tenantId),
      plan: TenantPlan.TRIAL,
      quotas: { maxUsers: 5, maxStorageBytes: 512 * 1024 * 1024, maxApiCallsPerDay: 1000 },
      isDeleted: false,
      usageStats: { usedStorageBytes: 1024, apiCallsToday: 10 },
    };
    tenantModel.findById
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(tenantData),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ usageStats: { apiCallsToday: 10 } }),
        }),
      });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(2),
    });
    tenantUsageHistoryModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });

    const result = await service.getTenantUsage(tenantId, {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(result.success).toBe(true);
    expect(result.data.plan).toBe(TenantPlan.TRIAL);
  });

  it('getTenantUsageHistory returns 30 day history', async () => {
    const tenantId = '64b000000000000000000001';
    tenantUsageHistoryModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await service.getTenantUsageHistory(tenantId, {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(30);
  });

  it('enforceApiQuota triggers quota alert when >= 80% usage', async () => {
    const tenantId = '64b000000000000000000001';
    tenantModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(tenantId),
              status: TenantStatus.ACTIVE,
              plan: TenantPlan.TRIAL,
              isDeleted: false,
              usageStats: { usedStorageBytes: 0 },
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            usageStats: { apiCallsToday: 799 },
          }),
        }),
      });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(2),
    });
    tenantUsageHistoryModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });

    // Should resolve without throwing — quota alert published fire-and-forget
    await expect(
      service.enforceApiQuota(tenantId, '/api/test'),
    ).resolves.toBeUndefined();
  });

  it('onModuleInit seeds subscription plans and runs initial trial sweep', async () => {
    (tenantModel.find as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await service.onModuleInit();

    expect(subscriptionPlanModel.updateOne).toHaveBeenCalledTimes(4);

    await service.onModuleDestroy();
  });

  it('onModuleInit handles suspendExpiredTrials failure gracefully', async () => {
    (tenantModel.find as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('DB connection failed')),
        }),
      }),
    });

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    await service.onModuleDestroy();
  });

  it('onModuleDestroy clears sweep timer', async () => {
    (tenantModel.find as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect((service as any).expiredTrialSweepTimer).toBeNull();
  });

  it('onModuleInit handles non-Error rejection in sweep (describeError unknown branch)', async () => {
    // Reject with a plain string (non-Error) to cover describeError's "unknown" return branch
    (tenantModel.find as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue('plain string error'),
        }),
      }),
    });

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    await service.onModuleDestroy();
  });

  it('enforceApiQuota skips quota check for ENTERPRISE tenant (null maxApiCallsPerDay)', async () => {
    const tenantId = '64b000000000000000000001';
    tenantModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(tenantId),
              status: TenantStatus.ACTIVE,
              plan: TenantPlan.ENTERPRISE,
              isDeleted: false,
              usageStats: { usedStorageBytes: 0 },
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            usageStats: { apiCallsToday: 99999 },
          }),
        }),
      });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(50),
    });
    tenantUsageHistoryModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });

    // ENTERPRISE has null quota → no 429 even with very high count
    await expect(
      service.enforceApiQuota(tenantId, '/api/test'),
    ).resolves.toBeUndefined();
  });

  it('getMyTenant delegates to getTenantById', async () => {
    const tenantId = '64b000000000000000000001';
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(tenantId),
          isDeleted: false,
          status: TenantStatus.ACTIVE,
          plan: TenantPlan.TRIAL,
        }),
      }),
    });

    const result = await service.getMyTenant(tenantId, {
      roles: ['SUPER_ADMIN'],
    } as Express.User);

    expect(result.success).toBe(true);
  });
});
