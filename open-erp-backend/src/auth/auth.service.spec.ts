import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import { Types } from 'mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantStatus } from '../tenant/schemas/tenant.schema';
import { TokenService } from '../token/token.service';
import { User, UserStatus } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';

jest.mock('argon2');

type UserDocMock = {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  email: string;
  passwordHash: string;
  roles: string[];
  status: UserStatus;
  mfaEnabled: boolean;
  failedLoginCount: number;
  lockedUntil?: Date;
  isDeleted: boolean;
  lastLoginAt?: Date;
  save: jest.Mock;
};

describe('AuthService', () => {
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
      if (key === 'REDIS_URL') return undefined;
      return undefined;
    }),
  };

  const jwtService = {
    sign: jest.fn(() => 'jwt-token'),
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

  function makeUser(partial: Partial<UserDocMock> = {}): UserDocMock {
    return {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(),
      email: 'admin@acme.com',
      passwordHash: 'hashed',
      roles: ['TENANT_ADMIN'],
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
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
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(Tenant.name),
          useValue: tenantModel,
        },
        {
          provide: getModelToken('MfaChallenge'),
          useValue: mfaChallengeModel,
        },
        {
          provide: TokenService,
          useValue: mockedTokenService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RabbitMQService,
          useValue: rabbitMQService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService);

    jest.clearAllMocks();
  });

  it('login() success returns accessToken + refreshToken', async () => {
    const user = makeUser();
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
            }),
        }),
      }),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    tokenService.createRefreshToken.mockResolvedValue({
      refreshToken: 'refresh-token',
      expiresAt: new Date(),
    });

    const result = await service.login(
      {
        tenantId: user.tenantId.toString(),
        email: user.email,
        password: 'Password@123',
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('jwt-token');
    expect(result.data.refreshToken).toBe('refresh-token');
  });

  it('login() wrong password increments failedLoginCount and throws UnauthorizedException', async () => {
    const user = makeUser({ failedLoginCount: 1 });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'wrong-password',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(user.failedLoginCount).toBe(2);
    expect(user.save).toHaveBeenCalled();
  });

  it('login() wrong >= 5 times sets lockedUntil and throws LockedException', async () => {
    const user = makeUser({ failedLoginCount: 4 });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'wrong-password',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(HttpException);

    expect(user.failedLoginCount).toBe(5);
    expect(user.lockedUntil).toBeInstanceOf(Date);
  });

  it('login() with locked account throws 423 LockedException', async () => {
    const user = makeUser({
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
    });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'Password@123',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(HttpException);
  });

  it('refreshToken() valid rotates and returns new tokens', async () => {
    const user = makeUser();
    tokenService.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'new-refresh-token',
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      expiresAt: new Date(),
    });
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    const result = await service.refreshToken('old-refresh-token', {
      ip: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('jwt-token');
    expect(result.data.refreshToken).toBe('new-refresh-token');
    expect(result.data.refreshTokenExpiresAt).toBeInstanceOf(Date);
  });

  it('refreshToken() revoked token throws UnauthorizedException', async () => {
    tokenService.rotateRefreshToken.mockRejectedValue(
      new UnauthorizedException('revoked'),
    );

    await expect(
      service.refreshToken('revoked-token', {
        ip: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() signs access token with RS256 when RSA keys are configured', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue({ status: 'TRIAL', isDeleted: false }),
        }),
      }),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    tokenService.createRefreshToken.mockResolvedValue({
      refreshToken: 'refresh-token',
      expiresAt: new Date(),
    });
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_PRIVATE_KEY') return 'PRIVATE\\nKEY';
      if (key === 'JWT_PUBLIC_KEY') return 'PUBLIC\\nKEY';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'REDIS_URL') return undefined;
      return 'test-secret';
    });

    await service.login(
      {
        tenantId: user.tenantId.toString(),
        email: user.email,
        password: 'Password@123',
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        privateKey: 'PRIVATE\nKEY',
        algorithm: 'RS256',
      }),
    );
  });

  it('login() logs warning and falls back to HS256 when RSA config is incomplete', async () => {
    const user = makeUser();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue({ status: 'TRIAL', isDeleted: false }),
        }),
      }),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    tokenService.createRefreshToken.mockResolvedValue({
      refreshToken: 'refresh-token',
      expiresAt: new Date(),
    });
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_PRIVATE_KEY') return 'PRIVATE\\nKEY';
      if (key === 'JWT_PUBLIC_KEY') return undefined;
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'REDIS_URL') return undefined;
      return 'test-secret';
    });

    await service.login(
      {
        tenantId: user.tenantId.toString(),
        email: user.email,
        password: 'Password@123',
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        secret: 'test-secret',
        algorithm: 'HS256',
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'JWT RSA key configuration is incomplete. Falling back to HS256.',
    );
    warnSpy.mockRestore();
  });

  it('login() with MFA enabled returns mfaRequired response', async () => {
    const user = makeUser({ mfaEnabled: true });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            status: 'TRIAL',
            isDeleted: false,
            settings: {},
          }),
        }),
      }),
    });
    mfaChallengeModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mfaChallengeModel.create.mockResolvedValue({});
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await service.login(
      {
        tenantId: user.tenantId.toString(),
        email: user.email,
        password: 'Password@123',
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.success).toBe(true);
    expect(result.data.mfaRequired).toBe(true);
    expect(result.data.mfaToken).toBeDefined();
  });

  it('logout() adds JTI into redis blacklist', async () => {
    const addToBlacklist = jest
      .spyOn(
        service as unknown as {
          addToBlacklist: (jti: string, ttlSeconds: number) => Promise<void>;
        },
        'addToBlacklist',
      )
      .mockResolvedValue(undefined);

    const now = Math.floor(Date.now() / 1000);

    const result = await service.logout(
      {
        sub: 'user-id',
        tenantId: 'tenant-id',
        email: 'admin@acme.com',
        roles: ['TENANT_ADMIN'],
        jti: 'jti-123',
        iat: now - 5,
        exp: now + 900,
      },
      {
        refreshToken: 'refresh-token',
        ip: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(result.success).toBe(true);
    expect(addToBlacklist).toHaveBeenCalledWith('jti-123', expect.any(Number));
  });

  it('logout() without refreshToken revokes all user refresh tokens', async () => {
    const now = Math.floor(Date.now() / 1000);

    await service.logout(
      {
        sub: 'user-id-2',
        tenantId: 'tenant-id',
        email: 'admin@acme.com',
        roles: ['TENANT_ADMIN'],
        jti: 'jti-456',
        iat: now - 5,
        exp: now + 900,
      },
      {
        ip: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(tokenService.revokeAllByUserId).toHaveBeenCalledWith('user-id-2');
  });

  it('forgotPassword() always returns 200-like success when email does not exist', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await service.forgotPassword(
      { email: 'missing@acme.com' },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.success).toBe(true);
    expect(tokenService.createPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('forgotPassword() existing email creates OTP and publishes event', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tokenService.createPasswordResetOtp.mockResolvedValue({
      otp: '123456',
      expiresAt: new Date(Date.now() + 600_000),
    });

    const result = await service.forgotPassword(
      { email: user.email },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.success).toBe(true);
    expect(tokenService.createPasswordResetOtp).toHaveBeenCalledWith({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
    });
    expect(rabbitMQService.publish).toHaveBeenCalledWith(
      'notification.send',
      expect.objectContaining({
        type: 'PASSWORD_RESET_OTP',
        email: user.email,
      }),
    );
  });

  it('resetPassword() valid OTP updates password and revokes refresh tokens', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tokenService.consumePasswordResetOtp.mockResolvedValue('valid');
    (argon2.hash as jest.Mock).mockResolvedValue('new-password-hash');

    const result = await service.resetPassword({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      otp: '123456',
      newPassword: 'NewPassword@123',
    });

    expect(result.success).toBe(true);
    expect(user.passwordHash).toBe('new-password-hash');
    expect(tokenService.revokeAllByUserId).toHaveBeenCalledWith(
      user._id.toString(),
    );
  });

  it('resetPassword() expired OTP throws BadRequestException', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tokenService.consumePasswordResetOtp.mockResolvedValue('expired');

    await expect(
      service.resetPassword({
        tenantId: user.tenantId.toString(),
        userId: user._id.toString(),
        otp: '123456',
        newPassword: 'NewPassword@123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('resetPassword() invalid OTP throws UnauthorizedException', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tokenService.consumePasswordResetOtp.mockResolvedValue('invalid');

    await expect(
      service.resetPassword({
        tenantId: user.tenantId.toString(),
        userId: user._id.toString(),
        otp: '000000',
        newPassword: 'NewPassword@123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('me() returns current user profile', async () => {
    const user = makeUser();
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: user._id,
            tenantId: user.tenantId,
            email: user.email,
            roles: user.roles,
            status: user.status,
            mfaEnabled: user.mfaEnabled,
            lastLoginAt: null,
          }),
        }),
      }),
    });

    const result = await service.me({
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      roles: user.roles,
      jti: 'jti',
      iat: 1,
      exp: 2,
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe(user.email);
  });

  it('login() blocked for SUSPENDED tenant — R1-003', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue({
              status: TenantStatus.SUSPENDED,
              isDeleted: false,
            }),
        }),
      }),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'Password@123',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('login() blocked when tenant does not exist — R1-003', async () => {
    const user = makeUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    tenantModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'Password@123',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('login() user not found throws UnauthorizedException', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.login(
        {
          tenantId: new Types.ObjectId().toString(),
          email: 'nobody@acme.com',
          password: 'Password@123',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() argon2.verify rejects is treated as invalid password', async () => {
    const user = makeUser({ failedLoginCount: 0 });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    // Make argon2.verify reject (error in hashing library)
    (argon2.verify as jest.Mock).mockRejectedValue(new Error('hash error'));

    await expect(
      service.login(
        {
          tenantId: user.tenantId.toString(),
          email: user.email,
          password: 'Password@123',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('onModuleDestroy() quits redis client when present', async () => {
    const fakeQuit = jest.fn().mockResolvedValue(undefined);
    (service as any).redisClient = { quit: fakeQuit };

    await service.onModuleDestroy();

    expect(fakeQuit).toHaveBeenCalled();
    expect((service as any).redisClient).toBeNull();
  });
});
