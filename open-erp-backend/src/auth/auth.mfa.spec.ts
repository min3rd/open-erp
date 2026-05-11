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
      if (key === 'MFA_ENCRYPTION_KEY') return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
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
        { provide: getModelToken(MfaChallenge.name), useValue: mfaChallengeModel },
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
          exec: jest.fn().mockResolvedValue({ status: TenantStatus.TRIAL, isDeleted: false, settings: {} }),
        }),
      }),
    });
  });

  it('setupMfa returns QR code payload', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    const secretSpy = jest.spyOn(authenticator, 'generateSecret').mockReturnValue('JBSWY3DPEHPK3PXP');
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qr');

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
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qr');
    jest.spyOn(authenticator, 'generateSecret').mockReturnValue('JBSWY3DPEHPK3PXP');
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
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    mfaChallengeModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ used: false, expiresAt: new Date(Date.now() + 300000), save: jest.fn().mockResolvedValue(undefined) }) });
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
    jest.spyOn(authServicePrivateAccess(), 'decryptMfaSecret').mockReturnValue('secret');

    const result = await service.challengeMfa('jwt-token', '123456');

    expect(result.success).toBe(true);
    expect(result.data.refreshToken).toBe('refresh-token');
  });

  it('disableMfa clears MFA fields', async () => {
    const user = makeUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    jest.spyOn(authServicePrivateAccess(), 'decryptMfaSecret').mockReturnValue('secret');
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

  function authServicePrivateAccess(): Record<string, unknown> {
    return service as unknown as Record<string, unknown>;
  }
});
