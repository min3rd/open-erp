import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { NullStorageAdapter } from '../adapters/null-storage.adapter';
import { STORAGE_PROVISIONING_PORT } from '../adapters/storage-provisioning.port';
import { TenantStatus } from '../schemas/tenant.schema';
import { OnboardingService } from './onboarding.service';

jest.mock('argon2', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
  },
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('OnboardingService', () => {
  let service: OnboardingService;

  const userModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const nullStorage = new NullStorageAdapter();

  function makeTenant(overrides = {}) {
    return {
      _id: new Types.ObjectId('6642a0000000000000000010'),
      status: TenantStatus.TRIAL,
      ...overrides,
    } as any;
  }

  function makeRegistration(overrides = {}) {
    return {
      email: 'admin@acme.vn',
      ...overrides,
    } as any;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: STORAGE_PROVISIONING_PORT,
          useValue: nullStorage,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    jest.clearAllMocks();
  });

  it('creates admin user and returns real user ID when no existing user', async () => {
    const tenant = makeTenant();
    const registration = makeRegistration();

    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const createdUser = {
      _id: new Types.ObjectId('6642a0000000000000000099'),
      email: 'admin@acme.vn',
    };
    userModel.create.mockResolvedValue(createdUser);

    const result = await service.initializeTenant(tenant, registration);

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@acme.vn',
        roles: ['TENANT_ADMIN'],
        tenantId: tenant._id,
      }),
    );
    expect(result.adminUserId).toBe(createdUser._id.toString());
    expect(result.adminUserEmail).toBe('admin@acme.vn');
    expect(result.bucketName).toContain('tenant-');
  });

  it('is idempotent — reuses existing admin user without duplicating', async () => {
    const tenant = makeTenant();
    const registration = makeRegistration();

    const existingUser = {
      _id: new Types.ObjectId('6642a0000000000000000088'),
      email: 'admin@acme.vn',
    };
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(existingUser) });

    const result = await service.initializeTenant(tenant, registration);

    expect(userModel.create).not.toHaveBeenCalled();
    expect(result.adminUserId).toBe(existingUser._id.toString());
  });

  it('returns bucketName following tenant-{id} convention', async () => {
    const tenant = makeTenant();
    const registration = makeRegistration();

    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    userModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      email: 'admin@acme.vn',
    });

    const result = await service.initializeTenant(tenant, registration);

    expect(result.bucketName).toBe(`tenant-${tenant._id.toString()}`);
  });

  it('NullStorageAdapter returns created=false without throwing', async () => {
    const result = await nullStorage.createBucket('tenant-abc');
    expect(result.created).toBe(false);
    expect(result.provider).toBe('null');
    expect(result.bucketName).toBe('tenant-abc');
  });
});
