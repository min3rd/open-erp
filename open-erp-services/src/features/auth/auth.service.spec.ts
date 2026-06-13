import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Tenant } from '../../core/tenant/tenant.entity';
import { User } from '../../core/user/user.entity';
import { RedisService } from '../../core/redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let tenantRepoMock: { findOne: jest.Mock };
  let userRepoMock: { findOne: jest.Mock };
  let dataSourceMock: { createQueryRunner: jest.Mock };
  let queryRunnerMock: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { save: jest.Mock };
  };
  let jwtServiceMock: { sign: jest.Mock; verify: jest.Mock };
  let redisServiceMock: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    tenantRepoMock = {
      findOne: jest.fn(),
    };
    userRepoMock = {
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
  });
});
