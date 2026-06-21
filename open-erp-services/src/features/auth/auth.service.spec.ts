import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Tenant } from '../../core/tenant/tenant.entity';
import { User } from '../../core/user/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RedisService } from '../../core/redis/redis.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('mock-hashed-password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let tenantRepoMock: { findOne: jest.Mock };
  let userRepoMock: { findOne: jest.Mock };
  let roleRepoMock: { findOne: jest.Mock };
  let permissionRepoMock: { findOne: jest.Mock };
  let dataSourceMock: { createQueryRunner: jest.Mock };
  let queryRunnerMock: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { save: jest.Mock; findOne: jest.Mock };
  };
  let jwtServiceMock: { sign: jest.Mock; verify: jest.Mock };
  let redisServiceMock: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let configServiceMock: { get: jest.Mock };

  beforeEach(async () => {
    tenantRepoMock = {
      findOne: jest.fn(),
    };
    userRepoMock = {
      findOne: jest.fn(),
      save: jest.fn((entity) => Promise.resolve({ id: 'user-id', ...entity })),
    };
    roleRepoMock = {
      findOne: jest.fn(),
    };
    permissionRepoMock = {
      findOne: jest.fn(),
    };

    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn((entity: Record<string, unknown>) =>
          Promise.resolve({ id: 'mock-id', ...entity }),
        ),
        findOne: jest.fn((entityClass, options) =>
          Promise.resolve({ id: 'mock-id', code: options?.where?.code || 'mock-code' }),
        ),
      },
    };

    dataSourceMock = {
      createQueryRunner: jest.fn(() => queryRunnerMock),
    };

    jwtServiceMock = {
      sign: jest.fn(() => 'mock-token'),
      verify: jest.fn(() => ({ userId: 'mock-id' })),
    };

    redisServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantRepoMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepoMock,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepoMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkSubdomain', () => {
    it('should return false if subdomain is empty or has invalid pattern', async () => {
      expect(await service.checkSubdomain('')).toBe(false);
      expect(await service.checkSubdomain('invalid-subdomain')).toBe(false);
      expect(await service.checkSubdomain('subdomain!')).toBe(false);
    });

    it('should return true if subdomain is available', async () => {
      tenantRepoMock.findOne.mockResolvedValue(null);
      expect(await service.checkSubdomain('valid')).toBe(true);
    });

    it('should return false if subdomain is taken', async () => {
      tenantRepoMock.findOne.mockResolvedValue({ id: 'taken-id' });
      expect(await service.checkSubdomain('taken')).toBe(false);
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if subdomain is already taken', async () => {
      tenantRepoMock.findOne.mockResolvedValue({ id: 'taken-id' });
      const dto = {
        companyName: 'Test Company',
        email: 'admin@test.com',
        password: 'password123',
        subdomain: 'taken',
      };
      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email is already taken', async () => {
      tenantRepoMock.findOne.mockResolvedValue(null);
      userRepoMock.findOne.mockResolvedValue({ id: 'user-id' });
      const dto = {
        companyName: 'Test Company',
        email: 'taken@test.com',
        password: 'password123',
        subdomain: 'valid',
      };
      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('should register successfully if details are valid and unique', async () => {
      tenantRepoMock.findOne.mockResolvedValue(null);
      userRepoMock.findOne.mockResolvedValue(null);

      const dto = {
        companyName: 'Test Company',
        email: 'new@test.com',
        password: 'password123',
        subdomain: 'unique',
        phone: '1234567890',
      };

      const result = await service.register(dto);
      expect(result).toEqual({
        success: true,
        messageKey: 'auth.register_success',
      });
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should register successfully and generate subdomain if subdomain is omitted', async () => {
      tenantRepoMock.findOne.mockResolvedValue(null);
      userRepoMock.findOne.mockResolvedValue(null);

      const dto = {
        companyName: 'Test Company',
        email: 'new-no-sub@test.com',
        password: 'password123',
        phone: '1234567890',
      };

      const result = await service.register(dto);
      expect(result).toEqual({
        success: true,
        messageKey: 'auth.register_success',
      });
    });
  });

  describe('registerUser', () => {
    it('should throw BadRequestException if email is already taken', async () => {
      userRepoMock.findOne.mockResolvedValue({ id: 'user-id' });
      const dto = {
        email: 'taken@test.com',
        password: 'password123',
        firstName: 'Nguyễn Văn',
        lastName: 'A',
        phone: '0987654321',
      };
      await expect(service.registerUser(dto)).rejects.toThrow(BadRequestException);
    });

    it('should register user successfully if email is unique', async () => {
      userRepoMock.findOne.mockResolvedValue(null);
      const dto = {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'Nguyễn Văn',
        lastName: 'A',
        phone: '0987654321',
      };
      const result = await service.registerUser(dto);
      expect(result).toEqual({
        success: true,
        messageKey: 'auth.user_register_success',
      });
      expect(userRepoMock.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    let mockUser: any;
    let mockTenant1: any;
    let mockTenant2: any;

    beforeEach(() => {
      mockTenant1 = { id: 'tenant-1', name: 'GoTech', subdomain: 'gotech' };
      mockTenant2 = { id: 'tenant-2', name: 'SalesPro', subdomain: 'salespro' };
      mockUser = {
        id: 'user-id',
        email: 'employee@test.com',
        password: 'hashed-password',
        status: 'Active',
        tenantId: 'tenant-1',
        roles: [{ id: 'role-1', name: 'employee', tenantId: 'tenant-1' }],
        tenants: [mockTenant1, mockTenant2],
      };
      userRepoMock.findOne.mockReset();
      tenantRepoMock.findOne.mockReset();
      (bcrypt.compare as jest.Mock).mockReset();
    });

    it('should throw BadRequestException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);
      const dto = { email: 'notfound@test.com', password: 'password123' };
      await expect(service.login(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if account is not activated', async () => {
      mockUser.status = 'Pending';
      userRepoMock.findOne.mockResolvedValue(mockUser);
      const dto = { email: mockUser.email, password: 'password123' };
      await expect(service.login(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const dto = { email: mockUser.email, password: 'wrongpassword' };
      await expect(service.login(dto)).rejects.toThrow(BadRequestException);
    });

    it('should request tenant selection if user belongs to multiple tenants and no tenantId is specified', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tenantRepoMock.findOne.mockResolvedValue(mockTenant1);

      const dto = { email: mockUser.email, password: 'password123' };
      const result = await service.login(dto);

      expect(result).toEqual({
        success: true,
        data: {
          requireTenantSelection: true,
          tenants: [
            { id: 'tenant-1', name: 'GoTech', subdomain: 'gotech' },
            { id: 'tenant-2', name: 'SalesPro', subdomain: 'salespro' },
          ],
        },
      });
    });

    it('should login successfully with specified tenantId if user has access', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tenantRepoMock.findOne.mockResolvedValue(mockTenant1);

      const dto = { email: mockUser.email, password: 'password123' };
      const result = await service.login(dto, 'tenant-1');

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBeDefined();
      expect(result.data?.refreshToken).toBeDefined();
      expect(result.data?.tenant?.id).toBe('tenant-1');
      expect(redisServiceMock.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException if specified tenantId is not accessible', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = { email: mockUser.email, password: 'password123' };
      await expect(service.login(dto, 'non-existent-tenant')).rejects.toThrow(BadRequestException);
    });
  });

  describe('selectTenant', () => {
    it('should call login with tenantId correctly', async () => {
      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({ success: true } as any);
      const dto = { email: 'employee@test.com', password: 'password123', tenantId: 'tenant-1' };
      
      const result = await service.selectTenant(dto);

      expect(loginSpy).toHaveBeenCalledWith({ email: dto.email, password: dto.password }, dto.tenantId);
      expect(result).toEqual({ success: true });
    });
  });

  describe('loginWithGoogle', () => {
    let mockUser: any;
    let mockTenant1: any;

    beforeEach(() => {
      mockTenant1 = { id: 'tenant-1', name: 'GoTech', subdomain: 'gotech' };
      mockUser = {
        id: 'user-id',
        email: 'google-user@test.com',
        password: 'hashed-password',
        status: 'Active',
        tenantId: 'tenant-1',
        roles: [{ id: 'role-1', name: 'employee', tenantId: 'tenant-1' }],
        tenants: [mockTenant1],
      };
      userRepoMock.findOne.mockReset();
      tenantRepoMock.findOne.mockReset();
    });

    it('should auto-register and throw NO_TENANT_ASSOCIATED if user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.loginWithGoogle('mock_google_newuser@test.com')).rejects.toThrow(BadRequestException);
      expect(userRepoMock.save).toHaveBeenCalled();
    });

    it('should login successfully for existing user', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      tenantRepoMock.findOne.mockResolvedValue(mockTenant1);

      const result = await service.loginWithGoogle('mock_google_google-user@test.com', 'tenant-1');
      expect(result.success).toBe(true);
      expect(result.data?.tenant?.id).toBe('tenant-1');
    });
  });

  describe('loginWithMicrosoft', () => {
    let mockUser: any;
    let mockTenant1: any;

    beforeEach(() => {
      mockTenant1 = { id: 'tenant-1', name: 'GoTech', subdomain: 'gotech' };
      mockUser = {
        id: 'user-id',
        email: 'ms-user@test.com',
        password: 'hashed-password',
        status: 'Active',
        tenantId: 'tenant-1',
        roles: [{ id: 'role-1', name: 'employee', tenantId: 'tenant-1' }],
        tenants: [mockTenant1],
      };
      userRepoMock.findOne.mockReset();
      tenantRepoMock.findOne.mockReset();
    });

    it('should auto-register and throw NO_TENANT_ASSOCIATED if user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.loginWithMicrosoft('mock-access-token', 'mock_microsoft_newuser@test.com')).rejects.toThrow(BadRequestException);
      expect(userRepoMock.save).toHaveBeenCalled();
    });

    it('should login successfully for existing user', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      tenantRepoMock.findOne.mockResolvedValue(mockTenant1);

      const result = await service.loginWithMicrosoft('mock-access-token', 'mock_microsoft_ms-user@test.com', 'tenant-1');
      expect(result.success).toBe(true);
      expect(result.data?.tenant?.id).toBe('tenant-1');
    });
  });
});
