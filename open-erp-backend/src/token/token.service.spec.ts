import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';
import { PasswordResetToken } from './schemas/password-reset-token.schema';

describe('TokenService', () => {
  let service: TokenService;
  let mockRefreshTokenModel: any;
  let mockPasswordResetTokenModel: any;
  let configService: ConfigService;

  beforeEach(async () => {
    mockRefreshTokenModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    mockPasswordResetTokenModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                REFRESH_TOKEN_EXPIRES_DAYS: '7',
              };
              return config[key];
            }),
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: getModelToken(PasswordResetToken.name),
          useValue: mockPasswordResetTokenModel,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('createRefreshToken', () => {
    it('should create refresh token successfully', async () => {
      const params = {
        tenantId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
        deviceInfo: { userAgent: 'Mozilla/5.0' },
      };

      mockRefreshTokenModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...params,
      });

      const result = await service.createRefreshToken(params);

      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result.refreshToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.expiresAt instanceof Date).toBe(true);
      expect(mockRefreshTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: expect.any(Types.ObjectId),
          userId: expect.any(Types.ObjectId),
          isRevoked: false,
        }),
      );
    });

    it('should set expiration time according to config', async () => {
      (configService.get as jest.Mock).mockReturnValue('14');

      const params = {
        tenantId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
      };

      mockRefreshTokenModel.create.mockResolvedValue({});

      const beforeCreate = Date.now();
      const result = await service.createRefreshToken(params);
      const afterCreate = Date.now();

      const expectedExpiration = 14 * 24 * 60 * 60 * 1000;
      const actualExpiration = result.expiresAt.getTime() - beforeCreate;

      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - 100);
      expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + 100);
    });

    it('should create token with default 7 days expiration', async () => {
      const params = {
        tenantId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
      };

      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.createRefreshToken(params);
      const futureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      expect(result.expiresAt.toDateString()).toBe(futureTime.toDateString());
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate active refresh token', async () => {
      const tokenDoc = {
        tokenHash: 'hash',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000),
      };

      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(tokenDoc),
      });

      const result = await service.validateRefreshToken('raw-token');

      expect(result).toEqual(tokenDoc);
    });

    it('should throw error for revoked token', async () => {
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          isRevoked: true,
          expiresAt: new Date(Date.now() + 1000),
        }),
      });

      await expect(
        service.validateRefreshToken('revoked-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for expired token', async () => {
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          isRevoked: false,
          expiresAt: new Date(Date.now() - 1000), // Past date
        }),
      });

      await expect(
        service.validateRefreshToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error when token not found', async () => {
      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.validateRefreshToken('nonexistent-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke old token and create new one', async () => {
      const oldTokenDoc = {
        isRevoked: false,
        tenantId: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockRefreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(oldTokenDoc),
      });

      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.rotateRefreshToken('old-token');

      expect(oldTokenDoc.isRevoked).toBe(true);
      expect(oldTokenDoc.save).toHaveBeenCalled();
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result.tenantId).toBe(oldTokenDoc.tenantId.toString());
      expect(result.userId).toBe(oldTokenDoc.userId.toString());
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke token by hash', async () => {
      const execSpy = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      mockRefreshTokenModel.updateOne.mockReturnValue({
        exec: execSpy,
      });

      await service.revokeRefreshToken('token-to-revoke');

      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { tokenHash: expect.any(String) },
        { $set: { isRevoked: true } },
      );
      expect(execSpy).toHaveBeenCalled();
    });
  });

  describe('revokeAllByUserId', () => {
    it('should revoke all active tokens for user', async () => {
      const execSpy = jest.fn().mockResolvedValue({ modifiedCount: 3 });
      mockRefreshTokenModel.updateMany.mockReturnValue({
        exec: execSpy,
      });

      const userId = new Types.ObjectId().toString();
      await service.revokeAllByUserId(userId);

      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        {
          userId: expect.any(Types.ObjectId),
          isRevoked: false,
        },
        { $set: { isRevoked: true } },
      );
      expect(execSpy).toHaveBeenCalled();
    });
  });

  describe('createPasswordResetOtp', () => {
    it('should create password reset OTP', async () => {
      const params = {
        tenantId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
      };

      mockPasswordResetTokenModel.create.mockResolvedValue({});

      const result = await service.createPasswordResetOtp(params);

      expect(result).toHaveProperty('otp');
      expect(result).toHaveProperty('expiresAt');
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.otp).toHaveLength(6);
      expect(mockPasswordResetTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: expect.any(Types.ObjectId),
          userId: expect.any(Types.ObjectId),
          isUsed: false,
        }),
      );
    });

    it('should set OTP expiration to 10 minutes', async () => {
      const params = {
        tenantId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
      };

      mockPasswordResetTokenModel.create.mockResolvedValue({});

      const beforeCreate = Date.now();
      const result = await service.createPasswordResetOtp(params);
      const afterCreate = Date.now();

      const expectedExpiration = 10 * 60 * 1000;
      const actualExpiration = result.expiresAt.getTime() - beforeCreate;

      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - 100);
      expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + 100);
    });
  });

  describe('consumePasswordResetOtp', () => {
    it('should return "valid" when OTP is correct and not expired', async () => {
      mockPasswordResetTokenModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'some-id' }),
      });

      const result = await service.consumePasswordResetOtp(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        '123456',
      );

      expect(result).toBe('valid');
    });

    it('should return "expired" when OTP has expired', async () => {
      mockPasswordResetTokenModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockPasswordResetTokenModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ _id: 'some-id' }),
          }),
        }),
      });

      const result = await service.consumePasswordResetOtp(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        '123456',
      );

      expect(result).toBe('expired');
    });

    it('should return "invalid" when OTP does not exist', async () => {
      mockPasswordResetTokenModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockPasswordResetTokenModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await service.consumePasswordResetOtp(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        'wrong-otp',
      );

      expect(result).toBe('invalid');
    });
  });

  describe('sha256', () => {
    it('should hash input correctly', () => {
      const input = 'test-input';
      const result = (service as any).sha256(input);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA256 hex is 64 chars
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce consistent hash', () => {
      const input = 'same-input';
      const hash1 = (service as any).sha256(input);
      const hash2 = (service as any).sha256(input);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = (service as any).sha256('input1');
      const hash2 = (service as any).sha256('input2');

      expect(hash1).not.toBe(hash2);
    });
  });
});
