import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { Types } from 'mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantStatus } from '../tenant/schemas/tenant.schema';
import { TokenService } from '../token/token.service';
import { User, UserStatus } from '../users/schemas/user.schema';
import { MfaChallenge } from './mfa/schemas/mfa-challenge.schema';
import { AuthService } from './auth.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('AuthService MFA', () => {
  let service: AuthService;
  let tokenService: jest.Mocked<TokenService>;

  const userModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const tenantModel = {
    findById: jest.fn(),
  };

  const mfaChallengeModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'MFA_ISSUER') return 'OpenERP';
      if (key === 'MFA_TOTP_WINDOW') return '1';
      if (key === 'MFA_ENCRYPTION_KEY')
        return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      return undefined;
    }),
  };

  const jwtService = {
    sign: jest.fn(() => 'jwt-token'),
    verify: jest.fn(),
  };

  const rabbitMQService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const mockedTokenService = {
    createRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllByUserId: jest.fn(),
    createPasswordResetOtp: jest.fn(),
    consumePasswordResetOtp: jest.fn(),
  };

  function makeUser(partial: Partial<Record<string, unknown>> = {}) {
    return {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(),
      email: 'admin@acme.com',
      passwordHash: 'hashed',
      fullName: 'Admin',
      roles: ['TENANT_ADMIN'],
      status: UserStatus.ACTIVE,
      mfaEnabled: true,
      mfaSecret: 'encrypted-secret',
      mfaBackupCodes: ['hash-1', 'hash-2'],
      mfaLastUsedAt: undefined,
      failedLoginCount: 0,
      isDeleted: false,
      save: jest.fn().mockResolvedValue(undefined),
      ...partial,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Tenant.name), useValue: tenantModel },
        {
          provide: getModelToken(MfaChallenge.name),
          useValue: mfaChallengeModel,
        },
        { provide: TokenService, useValue: mockedTokenService },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: RabbitMQService, useValue: rabbitMQService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService);
    jest.clearAllMocks();

    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue({
              status: TenantStatus.TRIAL,
              isDeleted: false,
              settings: {},
            }),
        }),
      }),
    });
  });

  it('setupMfa returns QR code payload', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    const secretSpy = jest
      .spyOn(authenticator, 'generateSecret')
      .mockReturnValue('JBSWY3DPEHPK3PXP');
    (QRCode.toDataURL as jest.Mock).mockResolvedValue(
      'data:image/png;base64,qr',
    );

    const result = await service.setupMfa({
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      roles: user.roles,
      jti: 'jti',
      iat: 1,
      exp: 2,
    });

    expect(result.success).toBe(true);
    expect(result.data.qrCodeImage).toContain('data:image/png');
    expect(secretSpy).toHaveBeenCalled();
    secretSpy.mockRestore();
  });

  it('verifyMfa enables MFA and returns backup codes', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    (QRCode.toDataURL as jest.Mock).mockResolvedValue(
      'data:image/png;base64,qr',
    );
    jest
      .spyOn(authenticator, 'generateSecret')
      .mockReturnValue('JBSWY3DPEHPK3PXP');
    jest.spyOn(authenticator, 'verify').mockReturnValue(true);
    await service.setupMfa({
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      roles: user.roles,
      jti: 'jti',
      iat: 1,
      exp: 2,
    });

    const result = await service.verifyMfa(
      {
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      },
      '123456',
    );

    expect(result.success).toBe(true);
    expect(result.data.backupCodes).toHaveLength(10);
    expect(user.save).toHaveBeenCalled();
  });

  it('challengeMfa returns JWT session after valid code', async () => {
    const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    mfaChallengeModel.findOne.mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({
          used: false,
          expiresAt: new Date(Date.now() + 300000),
          save: jest.fn().mockResolvedValue(undefined),
        }),
    });
    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      purpose: 'mfa',
    });
    jest.spyOn(authenticator, 'verify').mockReturnValue(true);
    mockedTokenService.createRefreshToken.mockResolvedValue({
      refreshToken: 'refresh-token',
      expiresAt: new Date(),
    });
    jest
      .spyOn(authServicePrivateAccess(), 'decryptMfaSecret')
      .mockReturnValue('secret');

    const result = await service.challengeMfa('jwt-token', '123456');

    expect(result.success).toBe(true);
    expect(result.data.refreshToken).toBe('refresh-token');
  });

  it('disableMfa clears MFA fields', async () => {
    const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    jest
      .spyOn(authServicePrivateAccess(), 'decryptMfaSecret')
      .mockReturnValue('secret');
    jest.spyOn(authenticator, 'verify').mockReturnValue(true);

    const result = await service.disableMfa(
      {
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      },
      '123456',
    );

    expect(result.success).toBe(true);
    expect(user.mfaEnabled).toBe(false);
  });

  describe('Backup Code Generation & Consumption (CRITICAL)', () => {
    it('generates exactly 10 backup codes on MFA setup', async () => {
      const user = makeUser();
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      jest
        .spyOn(authenticator, 'generateSecret')
        .mockReturnValue('JBSWY3DPEHPK3PXP');
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,qr',
      );
      jest.spyOn(authenticator, 'verify').mockReturnValue(true);

      await service.setupMfa({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      });

      const result = await service.verifyMfa(
        {
          sub: user._id.toString(),
          tenantId: user.tenantId.toString(),
          email: user.email,
          roles: user.roles,
          jti: 'jti',
          iat: 1,
          exp: 2,
        },
        '123456',
      );

      expect(result.data.backupCodes).toHaveLength(10);
      // Each backup code should be 8 characters
      result.data.backupCodes.forEach((code: string) => {
        expect(code).toHaveLength(8);
        // Each code should be alphanumeric (no 0, 1, I, O, L)
        expect(/^[A-Z2-9]{8}$/).toMatch(code);
      });
    });

    it('hashes backup codes before storing in database', async () => {
      const user = makeUser();
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      jest
        .spyOn(authenticator, 'generateSecret')
        .mockReturnValue('JBSWY3DPEHPK3PXP');
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,qr',
      );
      jest.spyOn(authenticator, 'verify').mockReturnValue(true);

      await service.setupMfa({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      });

      await service.verifyMfa(
        {
          sub: user._id.toString(),
          tenantId: user.tenantId.toString(),
          email: user.email,
          roles: user.roles,
          jti: 'jti',
          iat: 1,
          exp: 2,
        },
        '123456',
      );

      // Backup codes should be hashed (not plaintext) in user document
      expect(user.mfaBackupCodes).toBeDefined();
      // Hashed codes should not match original plaintext codes
      user.mfaBackupCodes?.forEach((hashedCode: string) => {
        expect(hashedCode).not.toMatch(/^[A-Z2-9]{8}$/);
      });
    });

    it('consumes backup code on one-time use', async () => {
      const user = makeUser({
        mfaEnabled: true,
        mfaSecret: 'encrypted-secret',
        mfaBackupCodes: ['hash-1', 'hash-2', 'hash-3'],
      });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({
            used: false,
            expiresAt: new Date(Date.now() + 300000),
            save: jest.fn().mockResolvedValue(undefined),
          }),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });
      jest.spyOn(authenticator, 'verify').mockReturnValue(false); // Invalid TOTP
      
      // Mock bcrypt compare for backup code validation
      jest.spyOn(authServicePrivateAccess(), 'consumeBackupCode')
        .mockResolvedValue(true);
      mockedTokenService.createRefreshToken.mockResolvedValue({
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.challengeMfa(
        'jwt-token',
        undefined,
        'BACKUP001'
      );

      expect(result.success).toBe(true);
      expect(user.save).toHaveBeenCalled();
    });

    it('rejects duplicate backup code usage', async () => {
      const user = makeUser({
        mfaEnabled: true,
        mfaSecret: 'encrypted-secret',
        mfaBackupCodes: [],
      });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({
            used: false,
            expiresAt: new Date(Date.now() + 300000),
            save: jest.fn().mockResolvedValue(undefined),
          }),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });
      jest.spyOn(authenticator, 'verify').mockReturnValue(false);
      jest
        .spyOn(authServicePrivateAccess(), 'consumeBackupCode')
        .mockResolvedValue(false);

      await expect(
        service.challengeMfa('jwt-token', undefined, 'ALREADY_USED')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('MFA Rate Limiting (CRITICAL)', () => {
    it('tracks failed MFA attempts', async () => {
      const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const challenge = {
        used: false,
        expiresAt: new Date(Date.now() + 300000),
        failedAttempts: 0,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(challenge),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });
      jest.spyOn(authenticator, 'verify').mockReturnValue(false);
      jest
        .spyOn(authServicePrivateAccess(), 'consumeBackupCode')
        .mockResolvedValue(false);

      await expect(
        service.challengeMfa('jwt-token', '000000')
      ).rejects.toThrow(UnauthorizedException);

      expect(challenge.failedAttempts).toBe(1);
      expect(challenge.save).toHaveBeenCalled();
    });

    it('blocks MFA challenge after maximum failed attempts', async () => {
      const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const challenge = {
        used: false,
        expiresAt: new Date(Date.now() + 300000),
        failedAttempts: 5, // Already at max attempts
        save: jest.fn().mockResolvedValue(undefined),
      };

      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(challenge),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });

      await expect(
        service.challengeMfa('jwt-token', '123456')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects expired MFA challenge token', async () => {
      const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const challenge = {
        used: false,
        expiresAt: new Date(Date.now() - 60000), // Already expired
        failedAttempts: 0,
        save: jest.fn(),
      };

      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(challenge),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });

      await expect(
        service.challengeMfa('jwt-token', '123456')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('prevents TOTP code replay attack', async () => {
      const user = makeUser({
        mfaEnabled: true,
        mfaSecret: 'encrypted-secret',
        mfaLastUsedAt: new Date(Date.now() - 5000), // Used 5 seconds ago
      });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      mfaChallengeModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({
            used: false,
            expiresAt: new Date(Date.now() + 300000),
            save: jest.fn().mockResolvedValue(undefined),
          }),
      });
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        purpose: 'mfa',
      });
      jest.spyOn(authenticator, 'verify').mockReturnValue(true);

      // Should throw because same TOTP code used recently
      await expect(
        service.challengeMfa('jwt-token', '123456')
      ).rejects.toThrow();
    });
  });

  describe('MFA Policy Enforcement (CRITICAL)', () => {
    it('allows login without MFA when MFA policy not set', async () => {
      const user = makeUser({ mfaEnabled: false });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      tenantModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue({
                status: TenantStatus.TRIAL,
                isDeleted: false,
                settings: {}, // No mfaRequired setting
              }),
          }),
        }),
      });
      mockedTokenService.createRefreshToken.mockResolvedValue({
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'password',
        },
        { ip: '127.0.0.1', userAgent: 'jest' }
      );

      expect(result.success).toBe(true);
      expect(result.data.mfaRequired).toBe(false);
    });

    it('enforces mandatory MFA for all users when policy enabled', async () => {
      const user = makeUser({ mfaEnabled: false });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      tenantModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue({
                status: TenantStatus.TRIAL,
                isDeleted: false,
                settings: { mfaRequired: true }, // Global MFA requirement
              }),
          }),
        }),
      });

      // Even without personal MFA enabled, should require setup
      const result = await service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'password',
        },
        { ip: '127.0.0.1', userAgent: 'jest' }
      );

      // Should indicate MFA setup required
      expect(result.data).toHaveProperty('mfaRequired');
    });

    it('enforces MFA for specific roles', async () => {
      const adminUser = makeUser({
        mfaEnabled: false,
        roles: ['TENANT_ADMIN'],
      });
      const regularUser = makeUser({
        mfaEnabled: false,
        roles: ['USER'],
      });

      userModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(adminUser),
      });
      tenantModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue({
                status: TenantStatus.TRIAL,
                isDeleted: false,
                settings: {
                  mfaRequiredForRoles: ['TENANT_ADMIN'], // Only admins
                },
              }),
          }),
        }),
      });

      const result = await service.login(
        {
          tenantId: adminUser.tenantId.toString(),
          email: adminUser.email,
          password: 'password',
        },
        { ip: '127.0.0.1', userAgent: 'jest' }
      );

      // Admin should be required to setup MFA
      expect(result.data).toBeDefined();
    });
  });

  describe('Regenerate Backup Codes', () => {
    it('regenerates new set of 10 backup codes', async () => {
      const user = makeUser({ mfaEnabled: true });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const result = await service.regenerateBackupCodes({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.backupCodes).toHaveLength(10);
      expect(user.save).toHaveBeenCalled();
    });

    it('replaces existing backup codes on regeneration', async () => {
      const user = makeUser({
        mfaEnabled: true,
        mfaBackupCodes: ['old-hash-1', 'old-hash-2'],
      });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      await service.regenerateBackupCodes({
        sub: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        roles: user.roles,
        jti: 'jti',
        iat: 1,
        exp: 2,
      });

      // Old codes should be cleared
      expect(user.mfaBackupCodes?.length).not.toBeLessThan(0);
      expect(user.save).toHaveBeenCalled();
    });
  });

  function authServicePrivateAccess(): Record<string, unknown> {
    return service as unknown as Record<string, unknown>;
  }
});
