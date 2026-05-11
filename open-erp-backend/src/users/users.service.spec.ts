import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantPlan } from '../tenant/schemas/tenant.schema';
import { UsersService } from './users.service';
import { User, UserStatus } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const userModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const tenantModel = {
    findById: jest.fn(),
  };

  const rabbitMQService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Tenant.name), useValue: tenantModel },
        { provide: RabbitMQService, useValue: rabbitMQService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('createUser publishes user.created', async () => {
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          plan: TenantPlan.TRIAL,
          quotas: { maxUsers: 5 },
          isDeleted: false,
        }),
      }),
    });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    userModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(),
      email: 'user@acme.com',
      fullName: 'User A',
      roles: [],
      status: UserStatus.PENDING_ACTIVATION,
    });

    const result = await service.createUser(
      {
        email: 'user@acme.com',
        fullName: 'User A',
      },
      {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User,
    );

    expect(result.success).toBe(true);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({ email: 'user@acme.com' }),
    );
  });

  it('createUser rejects duplicate email', async () => {
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          plan: TenantPlan.TRIAL,
          quotas: { maxUsers: 5 },
          isDeleted: false,
        }),
      }),
    });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'duplicate' }),
      }),
    });

    await expect(
      service.createUser({ email: 'user@acme.com', fullName: 'User A' }, {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(ConflictException);
  });

  it('deleteUser blocks deleting ACTIVE users', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        status: UserStatus.ACTIVE,
        isDeleted: false,
        save: jest.fn(),
      }),
    });

    await expect(
      service.deleteUser('64b000000000000000000002', {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('bootstrapTenantAdmin returns existing admin when present', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          tenantId: new Types.ObjectId('64b000000000000000000001'),
          email: 'admin@acme.com',
          fullName: 'Quản trị viên',
          roles: ['TENANT_ADMIN'],
          status: UserStatus.ACTIVE,
        }),
      }),
    });

    const result = await service.bootstrapTenantAdmin({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
    });

    expect(result.success).toBe(true);
    expect(rabbitMQService.publish).not.toHaveBeenCalled();
  });

  it('getMe returns not found when current user missing', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getMe({
        sub: '64b000000000000000000002',
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(NotFoundException);
  });
});
