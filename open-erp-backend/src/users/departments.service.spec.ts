import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { DepartmentsService } from './departments.service';
import { Department } from './schemas/department.schema';
import { User } from './schemas/user.schema';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const departmentModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const userModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  const tenantModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getModelToken(Department.name), useValue: departmentModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Tenant.name), useValue: tenantModel },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    jest.clearAllMocks();
  });

  it('createDepartment stores nested department information', async () => {
    departmentModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId('64b000000000000000000010'),
          level: 1,
          path: '/root',
        }),
      }),
    });
    departmentModel.create.mockResolvedValue({
      _id: new Types.ObjectId('64b000000000000000000011'),
      tenantId: new Types.ObjectId('64b000000000000000000001'),
      name: 'Team A',
      parentId: new Types.ObjectId('64b000000000000000000010'),
      level: 2,
      path: '/root/64b000000000000000000010',
      order: 0,
      isActive: true,
    });

    const result = await service.createDepartment(
      { name: 'Team A', parentId: '64b000000000000000000010' },
      {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User,
    );

    expect(result.success).toBe(true);
    expect(result.data.path).toContain('64b000000000000000000010');
  });

  it('getTree nests children under their parent', async () => {
    departmentModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { _id: '1', tenantId: 't', name: 'Root', isDeleted: false },
            {
              _id: '2',
              tenantId: 't',
              name: 'Child',
              parentId: '1',
              isDeleted: false,
            },
          ]),
        }),
      }),
    });

    const result = await service.getTree({
      tenantId: '64b000000000000000000001',
      roles: ['TENANT_ADMIN'],
    } as Express.User);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].children).toHaveLength(1);
  });

  it('deleteDepartment blocks deletion when members exist', async () => {
    userModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    await expect(
      service.deleteDepartment('64b000000000000000000020', {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('getDepartmentById throws when missing', async () => {
    departmentModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getDepartmentById('64b000000000000000000030', {
        tenantId: '64b000000000000000000001',
        roles: ['TENANT_ADMIN'],
      } as Express.User),
    ).rejects.toThrow(NotFoundException);
  });
});
