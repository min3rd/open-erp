import {
  ConflictException,
  ForbiddenException,
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

  const mockUserDoc = {
    _id: new Types.ObjectId('64b000000000000000000002'),
    tenantId: new Types.ObjectId('64b000000000000000000001'),
    email: 'user@acme.com',
    fullName: 'User A',
    roles: [],
    status: UserStatus.PENDING_ACTIVATION,
    phone: null,
    avatarUrl: null,
    departmentId: null,
    positionTitle: null,
    managerId: null,
    employeeCode: null,
    mfaEnabled: false,
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
    isSystemUser: false,
  };

  const adminActor = {
    sub: '64b000000000000000000003',
    tenantId: '64b000000000000000000001',
    roles: ['TENANT_ADMIN'],
  } as Express.User;

  it('getMe returns current user successfully', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      }),
    });

    const result = await service.getMe({
      sub: '64b000000000000000000002',
      tenantId: '64b000000000000000000001',
      roles: [],
    } as Express.User);

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('user@acme.com');
  });

  it('updateMe returns updated profile', async () => {
    const updated = { ...mockUserDoc, fullName: 'Updated Name' };
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      }),
    });

    const result = await service.updateMe(
      { sub: '64b000000000000000000002', tenantId: '64b000000000000000000001', roles: [] } as Express.User,
      { fullName: 'Updated Name' },
    );

    expect(result.success).toBe(true);
    expect(result.data.fullName).toBe('Updated Name');
  });

  it('updateMe throws NotFoundException when user not found', async () => {
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateMe(
        { sub: '64b000000000000000000002', tenantId: '64b000000000000000000001', roles: [] } as Express.User,
        { fullName: 'Updated' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('getUserById returns user', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      }),
    });

    const result = await service.getUserById('64b000000000000000000002', adminActor);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('64b000000000000000000002');
  });

  it('getUserById throws NotFoundException when user not found', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getUserById('64b000000000000000000002', adminActor),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateUser updates user fields', async () => {
    const updated = { ...mockUserDoc, fullName: 'Changed Name' };
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      }),
    });

    const result = await service.updateUser('64b000000000000000000002', { fullName: 'Changed Name' }, adminActor);

    expect(result.success).toBe(true);
    expect(result.data.fullName).toBe('Changed Name');
  });

  it('updateUser throws NotFoundException when user not found', async () => {
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateUser('64b000000000000000000002', { fullName: 'Changed' }, adminActor),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateUser throws ForbiddenException for non-admin', async () => {
    await expect(
      service.updateUser('64b000000000000000000002', { fullName: 'Changed' }, {
        tenantId: '64b000000000000000000001',
        roles: ['USER'],
      } as Express.User),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deleteUser soft-deletes non-ACTIVE users', async () => {
    const mockDoc = {
      status: UserStatus.PENDING_ACTIVATION,
      isDeleted: false,
      deletedAt: undefined,
      save: jest.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDoc),
    });

    const result = await service.deleteUser('64b000000000000000000002', adminActor);

    expect(result.success).toBe(true);
    expect(result.data.deleted).toBe(true);
    expect(mockDoc.isDeleted).toBe(true);
    expect(mockDoc.save).toHaveBeenCalled();
  });

  it('deleteUser throws NotFoundException when user not found', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.deleteUser('64b000000000000000000002', adminActor),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateStatus changes user status', async () => {
    const updated = { ...mockUserDoc, status: UserStatus.ACTIVE };
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      }),
    });

    const result = await service.updateStatus('64b000000000000000000002', UserStatus.ACTIVE, adminActor);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe(UserStatus.ACTIVE);
  });

  it('updateStatus throws NotFoundException when user not found', async () => {
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateStatus('64b000000000000000000002', UserStatus.ACTIVE, adminActor),
    ).rejects.toThrow(NotFoundException);
  });

  it('uploadAvatar updates avatar URL', async () => {
    const updated = { ...mockUserDoc, avatarUrl: 'https://cdn.example.com/avatar.jpg' };
    userModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      }),
    });

    const result = await service.uploadAvatar(
      '64b000000000000000000003',
      'https://cdn.example.com/avatar.jpg',
      { size: 1024 },
      adminActor,
    );

    expect(result.success).toBe(true);
    expect(result.data.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('listUsers returns paginated results', async () => {
    userModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockUserDoc]),
            }),
          }),
        }),
      }),
    });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const result = await service.listUsers(
      { page: 1, limit: 10 },
      { tenantId: '64b000000000000000000001', roles: [] } as Express.User,
    );

    expect(result.success).toBe(true);
    expect(result.pagination.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('listUsers applies search and departmentId filters', async () => {
    userModel.find.mockReturnValue({
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
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    const result = await service.listUsers(
      {
        search: 'John',
        departmentId: '64b000000000000000000005',
        status: UserStatus.ACTIVE,
      },
      { tenantId: '64b000000000000000000001', roles: [] } as Express.User,
    );

    expect(result.success).toBe(true);
    expect(result.pagination.total).toBe(0);
  });

  it('bootstrapTenantAdmin creates new admin when not present', async () => {
    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    userModel.create.mockResolvedValue({
      _id: new Types.ObjectId('64b000000000000000000010'),
      tenantId: new Types.ObjectId('64b000000000000000000001'),
      email: 'admin@acme.com',
      fullName: 'Quản trị viên',
      roles: ['TENANT_ADMIN'],
      status: UserStatus.ACTIVE,
    });

    const result = await service.bootstrapTenantAdmin({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
    });

    expect(result.success).toBe(true);
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({ role: 'TENANT_ADMIN' }),
    );
  });

  it('assertTenantCapacity throws when quota exceeded', async () => {
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          plan: TenantPlan.TRIAL,
          quotas: { maxUsers: 3 },
          isDeleted: false,
        }),
      }),
    });
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(3),
    });

    await expect(
      service.assertTenantCapacity('64b000000000000000000001'),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('assertTenantCapacity throws when tenant not found', async () => {
    tenantModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.assertTenantCapacity('64b000000000000000000001'),
    ).rejects.toThrow(NotFoundException);
  });
});
