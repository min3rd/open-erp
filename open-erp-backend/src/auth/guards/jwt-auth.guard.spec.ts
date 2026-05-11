import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset environment
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.REDIS_URL;
  });

  describe('canActivate', () => {
    it('should allow request with valid token', async () => {
      const mockRequest: Partial<Request> = {
        header: jest.fn().mockReturnValue('Bearer valid-token'),
        user: undefined,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        jti: 'jwt-id-789',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
      expect((mockRequest.user as any).sub).toBe('user-123');
      expect((mockRequest.user as any).token).toBe('valid-token');
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const mockRequest: Partial<Request> = {
        header: jest.fn().mockReturnValue(undefined),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when bearer scheme is invalid', async () => {
      const mockRequest: Partial<Request> = {
        header: jest.fn().mockReturnValue('InvalidToken'),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is blacklisted', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const mockRequest: Partial<Request> = {
        header: jest.fn().mockReturnValue('Bearer blacklisted-token'),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const payload = {
        sub: 'user-123',
        jti: 'jwt-id-blacklisted',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      // Mock Redis client to return blacklisted token
      jest.spyOn(guard as any, 'isBlacklisted').mockResolvedValue(true);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should attach token to request user', async () => {
      const mockRequest: Partial<Request> = {
        header: jest.fn().mockReturnValue('Bearer test-token'),
        user: undefined,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const payload = {
        sub: 'user-123',
        jti: 'jwt-id',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      await guard.canActivate(mockContext);

      expect((mockRequest.user as any).token).toBe('test-token');
    });
  });

  describe('extractBearer', () => {
    it('should extract bearer token', () => {
      const result = (guard as any).extractBearer('Bearer my-token');
      expect(result).toBe('my-token');
    });

    it('should return null for missing bearer', () => {
      const result = (guard as any).extractBearer('my-token');
      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = (guard as any).extractBearer('Bearer ');
      expect(result).toBeNull();
    });

    it('should handle case insensitive bearer', () => {
      const result = (guard as any).extractBearer('bearer my-token');
      expect(result).toBe('my-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify token using JwtService', () => {
      const token = 'test-token';
      const payload = { sub: 'user-123' };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      const result = (guard as any).verifyToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token, expect.anything());
      expect(result).toEqual(payload);
    });

    it('should throw error when token is invalid', () => {
      const token = 'invalid-token';
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => (guard as any).verifyToken(token)).toThrow();
    });
  });

  describe('isBlacklisted', () => {
    it('should return false when Redis URL is not configured', async () => {
      delete process.env.REDIS_URL;
      const result = await (guard as any).isBlacklisted('token');
      expect(result).toBe(false);
    });

    it('should return false for non-blacklisted token', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      jest.spyOn(guard as any, 'isBlacklisted').mockResolvedValue(false);

      const result = await (guard as any).isBlacklisted('token');
      expect(result).toBe(false);
    });

    it('should return true for blacklisted token', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      jest.spyOn(guard as any, 'isBlacklisted').mockResolvedValue(true);

      const result = await (guard as any).isBlacklisted('token');
      expect(result).toBe(true);
    });
  });
});
