import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User } from '../../core/user/user.entity';
import { Employee } from './entities/employee.entity';
import { Tenant } from '../../core/tenant/tenant.entity';
import { Role } from '../auth/entities/role.entity';
import { Department } from './entities/department.entity';
import { MailService } from '../../core/mail/mail.service';
import { RedisService } from '../../core/redis/redis.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let employeeRepository: Repository<Employee>;
  let tenantRepository: Repository<Tenant>;
  let roleRepository: Repository<Role>;
  let departmentRepository: Repository<Department>;
  let mailService: MailService;
  let redisService: RedisService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockUserRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockDepartmentRepository = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendInviteEmail: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'APP_PROTOCOL') return 'http';
      if (key === 'APP_DOMAIN') return 'localhost:4200';
      return defaultValue;
    }),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Department),
          useValue: mockDepartmentRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    departmentRepository = module.get<Repository<Department>>(getRepositoryToken(Department));
    mailService = module.get<MailService>(MailService);
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invite', () => {
    it('should throw BadRequestException if user is already a member of tenant', async () => {
      const dto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const tenantId = 'tenant-1';

      mockQueryBuilder.getOne.mockResolvedValue({
        email: 'test@example.com',
        tenants: [{ id: 'tenant-1' }],
      });

      await expect(service.invite(dto, tenantId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if tenant is not found', async () => {
      const dto = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const tenantId = 'tenant-missing';

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.invite(dto, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should invite new user successfully', async () => {
      const dto = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        roleId: 'role-1',
      };
      const tenantId = 'tenant-1';

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockTenantRepository.findOne.mockResolvedValue({ id: 'tenant-1', name: 'Tenant 1', subdomain: 't1' });
      mockRoleRepository.findOne.mockResolvedValue({ id: 'role-1', name: 'Role 1', tenantId });
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      const result = await service.invite(dto, tenantId);

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('new@example.com');
      expect(result.data.status).toBe('Pending');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockMailService.sendInviteEmail).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a list of mapped user and employee profiles', async () => {
      const tenantId = 'tenant-1';
      mockQueryBuilder.getOne.mockReset(); // clear queries
      mockUserRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'user1@example.com',
            status: 'Active',
            roles: [{ name: 'Admin' }],
            tenants: [{ id: 'tenant-1' }],
          },
        ]),
      });
      mockEmployeeRepository.find.mockResolvedValue([
        {
          email: 'user1@example.com',
          id: 'emp-1',
          firstName: 'User',
          lastName: 'One',
          department: { id: 'dept-1', name: 'Dept 1' },
        },
      ]);

      const result = await service.findAll(tenantId);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('user-1');
      expect(result[0].roleName).toBe('Admin');
      expect(result[0].department.name).toBe('Dept 1');
    });
  });

  describe('resendInvite', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.resendInvite('user-missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not a member of tenant', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-1',
        tenants: [{ id: 'tenant-other' }],
      });
      await expect(service.resendInvite('user-1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is already Activated', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-1',
        status: 'Active',
        tenants: [{ id: 'tenant-1' }],
      });
      await expect(service.resendInvite('user-1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should resend activation link successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'Pending',
        tenants: [{ id: 'tenant-1', name: 'Tenant 1', subdomain: 't1' }],
      });

      const result = await service.resendInvite('user-1', 'tenant-1');
      expect(result.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockMailService.sendInviteEmail).toHaveBeenCalled();
    });
  });

  describe('cancelInvite', () => {
    it('should remove user and employee if status is Pending', async () => {
      const userMock = {
        id: 'user-1',
        email: 'user1@example.com',
        status: 'Pending',
        tenants: [{ id: 'tenant-1' }],
      };
      const empMock = {
        id: 'emp-1',
        email: 'user1@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(userMock);
      mockEmployeeRepository.findOne.mockResolvedValue(empMock);

      await service.cancelInvite('user-1', 'tenant-1');

      expect(mockEmployeeRepository.remove).toHaveBeenCalledWith(empMock);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(userMock);
    });

    it('should unlink user and remove employee if status is Active', async () => {
      const userMock = {
        id: 'user-1',
        email: 'user1@example.com',
        status: 'Active',
        tenants: [{ id: 'tenant-1' }, { id: 'tenant-2' }],
      };
      const empMock = {
        id: 'emp-1',
        email: 'user1@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(userMock);
      mockEmployeeRepository.findOne.mockResolvedValue(empMock);

      await service.cancelInvite('user-1', 'tenant-1');

      expect(mockEmployeeRepository.remove).toHaveBeenCalledWith(empMock);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(userMock.tenants.length).toBe(1);
    });
  });
});
