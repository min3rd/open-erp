import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import argon2 from 'argon2';
import bcryptjs from 'bcryptjs';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import Redis from 'ioredis';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantDocument, TenantStatus } from '../tenant/schemas/tenant.schema';
import { TokenService } from '../token/token.service';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';
import { MfaChallenge, MfaChallengeDocument } from './mfa/schemas/mfa-challenge.schema';
import { resolveJwtRuntimeConfig } from './auth-runtime.config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestUser } from './interfaces/request-user.interface';
import { JwtPayload } from './types/jwt-payload.type';

interface RequestContext {
  ip: string;
  userAgent: string;
}

type MfaLoginState = {
  mfaRequired: true;
  mfaToken: string;
  mfaSetupRequired?: boolean;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private redisClient: Redis | null = null;
  private jwtFallbackWarningLogged = false;
  private readonly mfaTokenTtlSeconds = 5 * 60;
  private readonly pendingMfaSecrets = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly tokenService: TokenService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(MfaChallenge.name)
    private readonly mfaChallengeModel: Model<MfaChallengeDocument>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => undefined);
      this.redisClient = null;
    }
  }

  async login(dto: LoginDto, context: RequestContext) {
    const email = dto.email.trim().toLowerCase();
    const tenantId = new Types.ObjectId(dto.tenantId);
    const user = await this.userModel
      .findOne({ tenantId, email, isDeleted: false })
      .exec();

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    this.assertUserNotLocked(user);

    const isValidPassword = await argon2
      .verify(user.passwordHash, dto.password)
      .catch(() => false);

    if (!isValidPassword) {
      const lockedByThreshold = await this.handleFailedLogin(user);
      if (lockedByThreshold) {
        throw new HttpException({
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked',
        }, HttpStatus.LOCKED);
      }

      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'User status is not active',
      });
    }

    // Check live tenant status from the tenants collection (source of truth).
    // This blocks login for SUSPENDED/TERMINATED tenants even if user.tenantStatus is stale.
    const tenant = await this.tenantModel
      .findById(user.tenantId)
      .select('status isDeleted')
      .lean()
      .exec();

    const allowedTenantStatuses: string[] = [TenantStatus.ACTIVE, TenantStatus.TRIAL];
    if (!tenant || tenant.isDeleted || !allowedTenantStatuses.includes(tenant.status)) {
      throw new ForbiddenException({
        code: 'TENANT_SUSPENDED',
        message: 'Tenant is suspended or inactive',
      });
    }

    const tenantMfaRequired = Boolean((tenant as { settings?: Record<string, unknown> })?.settings?.mfaRequired);
    if (user.mfaEnabled) {
      return {
        success: true,
        data: await this.createMfaChallengeState(user),
      };
    }

    user.failedLoginCount = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    user.status = UserStatus.ACTIVE;
    await user.save();

    const access = this.signAccessToken(user);
    const refresh = await this.tokenService.createRefreshToken({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      deviceInfo: {
        ip: context.ip,
        userAgent: context.userAgent,
      },
    });

    this.publishEvent('user.login', {
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      email: user.email,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        accessToken: access.token,
        refreshToken: refresh.refreshToken,
        refreshTokenExpiresAt: refresh.expiresAt,
        expiresIn: access.expiresIn,
        mfaRequired: false,
        mfaSetupRequired: tenantMfaRequired,
        user: {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles,
        },
      },
    };
  }

  async refreshToken(refreshToken: string, context: RequestContext) {
    const rotated = await this.tokenService.rotateRefreshToken(refreshToken, {
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const user = await this.userModel.findById(rotated.userId).exec();
    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid user for refresh token',
      });
    }

    const access = this.signAccessToken(user);

    return {
      success: true,
      data: {
        accessToken: access.token,
        refreshToken: rotated.refreshToken,
        refreshTokenExpiresAt: rotated.expiresAt,
        expiresIn: access.expiresIn,
      },
    };
  }

  async logout(
    user: RequestUser,
    params: { refreshToken?: string; ip: string; userAgent: string },
  ) {
    if (params.refreshToken) {
      await this.tokenService.revokeRefreshToken(params.refreshToken);
    } else {
      await this.tokenService.revokeAllByUserId(user.sub);
    }

    const ttlSeconds = Math.max(0, user.exp - Math.floor(Date.now() / 1000));
    if (ttlSeconds > 0 && user.jti) {
      await this.addToBlacklist(user.jti, ttlSeconds);
    }

    this.publishEvent('user.logout', {
      tenantId: user.tenantId,
      userId: user.sub,
      email: user.email,
      ip: params.ip,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        loggedOut: true,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, context: RequestContext) {
    const user = await this.userModel
      .findOne({ email: dto.email.trim().toLowerCase(), isDeleted: false })
      .exec();

    if (user) {
      const otp = await this.tokenService.createPasswordResetOtp({
        tenantId: user.tenantId.toString(),
        userId: user._id.toString(),
      });

      this.publishEvent('notification.send', {
        type: 'PASSWORD_RESET_OTP',
        email: user.email,
        otp: otp.otp,
        expiresAt: otp.expiresAt.toISOString(),
        tenantId: user.tenantId.toString(),
        userId: user._id.toString(),
        ip: context.ip,
        userAgent: context.userAgent,
      });
    }

    return {
      success: true,
      data: {
        accepted: true,
      },
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel
      .findOne({
        _id: new Types.ObjectId(dto.userId),
        tenantId: new Types.ObjectId(dto.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid reset credentials',
      });
    }

    const otpStatus = await this.tokenService.consumePasswordResetOtp(
      user.tenantId.toString(),
      user._id.toString(),
      dto.otp,
    );

    if (otpStatus === 'expired') {
      throw new BadRequestException({
        code: 'TOKEN_EXPIRED',
        message: 'OTP expired',
      });
    }

    if (otpStatus === 'invalid') {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired OTP',
      });
    }

    user.passwordHash = await argon2.hash(dto.newPassword);
    user.failedLoginCount = 0;
    user.lockedUntil = undefined;
    user.status = UserStatus.ACTIVE;
    await user.save();

    await this.tokenService.revokeAllByUserId(user._id.toString());

    return {
      success: true,
      data: {
        passwordReset: true,
      },
    };
  }

  async me(user: RequestUser) {
    const currentUser = await this.userModel
      .findById(user.sub)
      .select('_id tenantId email roles status mfaEnabled lastLoginAt')
      .lean()
      .exec();

    if (!currentUser) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    return {
      success: true,
      data: {
        id: String(currentUser._id),
        tenantId: String(currentUser.tenantId),
        email: currentUser.email,
        roles: currentUser.roles ?? [],
        status: currentUser.status,
        mfaEnabled: Boolean(currentUser.mfaEnabled),
        lastLoginAt: currentUser.lastLoginAt ?? null,
      },
    };
  }

  async setupMfa(user: RequestUser) {
    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(user.sub),
        tenantId: new Types.ObjectId(user.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!currentUser) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const secret = authenticator.generateSecret();
    await this.storePendingMfaSecret(currentUser.tenantId.toString(), currentUser._id.toString(), secret);
    const qrCodeUrl = this.buildMfaOtpAuthUrl(currentUser.email, secret);
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

    return {
      success: true,
      data: {
        secret,
        qrCodeUrl,
        qrCodeImage,
      },
    };
  }

  async verifyMfa(user: RequestUser, code: string) {
    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(user.sub),
        tenantId: new Types.ObjectId(user.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!currentUser) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const secret = await this.consumePendingMfaSecret(currentUser.tenantId.toString(), currentUser._id.toString());
    this.assertTotpNotReplayed(currentUser.mfaLastUsedAt);
    if (!secret || !this.verifyTotpCode(secret, code, user.tenantId)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA code',
      });
    }

    const backupCodes = this.generateBackupCodes();
    currentUser.mfaEnabled = true;
    currentUser.mfaSecret = this.encryptMfaSecret(secret);
    currentUser.mfaBackupCodes = await this.hashBackupCodes(backupCodes);
    currentUser.mfaEnabledAt = new Date();
    currentUser.mfaLastUsedAt = new Date();
    await currentUser.save();

    return {
      success: true,
      data: {
        backupCodes,
      },
    };
  }

  async disableMfa(user: RequestUser, code: string) {
    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(user.sub),
        tenantId: new Types.ObjectId(user.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!currentUser || !currentUser.mfaEnabled || !currentUser.mfaSecret) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'MFA is not enabled',
      });
    }

    const secret = this.decryptMfaSecret(currentUser.mfaSecret);
    if (!this.verifyTotpCode(secret, code, user.tenantId)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA code',
      });
    }

    currentUser.mfaEnabled = false;
    currentUser.mfaSecret = undefined;
    currentUser.mfaBackupCodes = [];
    currentUser.mfaEnabledAt = undefined;
    currentUser.mfaLastUsedAt = new Date();
    await currentUser.save();

    return {
      success: true,
      data: {
        disabled: true,
      },
    };
  }

  async regenerateBackupCodes(user: RequestUser) {
    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(user.sub),
        tenantId: new Types.ObjectId(user.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!currentUser || !currentUser.mfaEnabled) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'MFA is not enabled',
      });
    }

    const backupCodes = this.generateBackupCodes();
    currentUser.mfaBackupCodes = await this.hashBackupCodes(backupCodes);
    await currentUser.save();

    return {
      success: true,
      data: {
        backupCodes,
      },
    };
  }

  async challengeMfa(mfaToken: string, code?: string, backupCode?: string) {
    const payload = this.verifyMfaToken(mfaToken);
    const challengeToken = this.sha256(mfaToken);

    const challenge = await this.mfaChallengeModel.findOne({ token: challengeToken }).exec();
    if (!challenge || challenge.used || challenge.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA challenge',
      });
    }

    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(payload.sub),
        tenantId: new Types.ObjectId(payload.tenantId),
        isDeleted: false,
      })
      .exec();

    if (!currentUser || !currentUser.mfaEnabled || !currentUser.mfaSecret) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'MFA is not enabled',
      });
    }

    const secret = this.decryptMfaSecret(currentUser.mfaSecret);
    this.assertTotpNotReplayed(currentUser.mfaLastUsedAt);
    const verifiedByTotp = code ? this.verifyTotpCode(secret, code, payload.tenantId) : false;
    const verifiedByBackup = backupCode ? await this.consumeBackupCode(currentUser, backupCode) : false;

    if (!verifiedByTotp && !verifiedByBackup) {
      challenge.failedAttempts += 1;
      await challenge.save();
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA code',
      });
    }

    challenge.used = true;
    await challenge.save();

    currentUser.mfaLastUsedAt = new Date();
    await currentUser.save();

    const access = this.signAccessToken(currentUser);
    const refresh = await this.tokenService.createRefreshToken({
      tenantId: currentUser.tenantId.toString(),
      userId: currentUser._id.toString(),
      deviceInfo: {
        ip: 'unknown',
        userAgent: 'mfa',
      },
    });

    return {
      success: true,
      data: {
        accessToken: access.token,
        refreshToken: refresh.refreshToken,
        refreshTokenExpiresAt: refresh.expiresAt,
        expiresIn: access.expiresIn,
        user: {
          id: currentUser._id.toString(),
          email: currentUser.email,
          roles: currentUser.roles,
        },
      },
    };
  }

  private assertUserNotLocked(user: UserDocument): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException({
        code: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked',
      }, HttpStatus.LOCKED);
    }
  }

  private async handleFailedLogin(user: UserDocument): Promise<boolean> {
    const maxFailed = 5;
    const lockMinutes = 15;

    user.failedLoginCount = (user.failedLoginCount ?? 0) + 1;

    if (user.failedLoginCount >= maxFailed) {
      user.lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      user.status = UserStatus.LOCKED;
      await user.save();
      return true;
    }

    await user.save();
    return false;
  }

  private signAccessToken(user: UserDocument): { token: string; expiresIn: number } {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const jwtConfig = resolveJwtRuntimeConfig(this.configService);
    const jti = uuidv4();

    this.logJwtFallbackWarning(jwtConfig.warning, jwtConfig.usedFallback);

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      roles: user.roles ?? [],
      jti,
    };

    const token =
      jwtConfig.algorithm === 'RS256'
        ? this.jwtService.sign(payload, {
            privateKey: jwtConfig.signKey,
            algorithm: jwtConfig.algorithm,
            expiresIn: expiresIn as never,
          })
        : this.jwtService.sign(payload, {
            secret: jwtConfig.signKey,
            algorithm: jwtConfig.algorithm,
            expiresIn: expiresIn as never,
          });

    return {
      token,
      expiresIn: this.durationToSeconds(expiresIn),
    };
  }

  private logJwtFallbackWarning(warning: string | undefined, usedFallback: boolean): void {
    if (!usedFallback || !warning || this.jwtFallbackWarningLogged) {
      return;
    }

    this.jwtFallbackWarningLogged = true;
    this.logger.warn(warning);
  }

  private durationToSeconds(input: string): number {
    if (/^\d+$/.test(input)) {
      return Number(input);
    }

    const match = input.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900;
    }

    const value = Number(match[1]);
    const unit = match[2];

    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 3600;
    return value * 86400;
  }

  private async addToBlacklist(jti: string, ttlSeconds: number): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return;
    }

    const client = await this.getRedisClient(redisUrl);
    await client.set(`jwt:blacklist:${jti}`, '1', 'EX', ttlSeconds);
  }

  private async getRedisClient(redisUrl: string): Promise<Redis> {
    if (this.redisClient) {
      return this.redisClient;
    }

    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    await this.redisClient.connect().catch(() => {
      this.redisClient = null;
      throw new Error('Redis connection failed');
    });

    return this.redisClient;
  }

  private publishEvent(routingKey: string, payload: Record<string, unknown>): void {
    this.rabbitMQService.publish(routingKey, payload).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`Failed to publish ${routingKey}: ${message}`);
    });
  }

  private sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private async createMfaChallengeState(user: UserDocument): Promise<MfaLoginState> {
    const mfaToken = await this.issueMfaToken({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      email: user.email,
    });

    await this.mfaChallengeModel.create({
      tenantId: user.tenantId,
      userId: user._id,
      token: this.sha256(mfaToken),
      expiresAt: new Date(Date.now() + this.mfaTokenTtlSeconds * 1000),
      used: false,
      failedAttempts: 0,
    });

    return {
      mfaRequired: true,
      mfaToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
      },
    };
  }

  private async issueMfaToken(payload: { tenantId: string; userId: string; email: string }): Promise<string> {
    const jwtConfig = resolveJwtRuntimeConfig(this.configService);
    const data = {
      sub: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      purpose: 'mfa',
      jti: randomUUID(),
    };

    if (jwtConfig.algorithm === 'RS256') {
      return this.jwtService.sign(data, {
        privateKey: jwtConfig.signKey,
        algorithm: jwtConfig.algorithm,
        expiresIn: '5m' as never,
      });
    }

    return this.jwtService.sign(data, {
      secret: jwtConfig.signKey,
      algorithm: jwtConfig.algorithm,
      expiresIn: '5m' as never,
    });
  }

  private verifyMfaToken(token: string): { sub: string; tenantId: string; email: string; purpose?: string } {
    const jwtConfig = resolveJwtRuntimeConfig(this.configService);
    const payload = this.jwtService.verify(token, {
      ...(jwtConfig.algorithm === 'RS256'
        ? { publicKey: jwtConfig.verifyKey }
        : { secret: jwtConfig.signKey }),
      algorithms: [jwtConfig.algorithm],
    }) as { sub: string; tenantId: string; email: string; purpose?: string };

    if (payload.purpose !== 'mfa') {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA token',
      });
    }

    return payload;
  }

  private buildMfaOtpAuthUrl(email: string, secret: string): string {
    const issuer = this.configService.get<string>('MFA_ISSUER') ?? 'OpenERP';
    return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  private verifyTotpCode(secret: string, code: string, tenantId?: string): boolean {
    const windowSize = Number(this.configService.get<string>('MFA_TOTP_WINDOW') ?? '1');
    authenticator.options = { window: windowSize };

    return authenticator.verify({ token: code, secret });
  }

  private encryptMfaSecret(secret: string): string {
    const key = this.resolveMfaKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  private decryptMfaSecret(encrypted: string): string {
    const [ivBase64, payloadBase64, tagBase64] = encrypted.split(':');
    if (!ivBase64 || !payloadBase64 || !tagBase64) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid MFA secret',
      });
    }

    const key = this.resolveMfaKey();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(payloadBase64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private resolveMfaKey(): Buffer {
    const rawKey = this.configService.get<string>('MFA_ENCRYPTION_KEY') ?? this.configService.get<string>('JWT_SECRET') ?? 'open-erp-mfa-default-key';
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }

    return createHash('sha256').update(rawKey).digest();
  }

  private generateBackupCodes(): string[] {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 10 }, () =>
      Array.from({ length: 8 }, () => alphabet[randomBytes(1)[0] % alphabet.length]).join(''),
    );
  }

  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    const rounds = Number(this.configService.get<string>('MFA_BACKUP_BCRYPT_ROUNDS') ?? '10');
    return Promise.all(codes.map((code) => bcryptjs.hash(code, rounds)));
  }

  private async consumeBackupCode(user: UserDocument, backupCode: string): Promise<boolean> {
    for (const hashed of user.mfaBackupCodes ?? []) {
      const matched = await bcryptjs.compare(backupCode, hashed);
      if (matched) {
        user.mfaBackupCodes = (user.mfaBackupCodes ?? []).filter((value) => value !== hashed);
        await user.save();
        return true;
      }
    }

    return false;
  }

  private async storePendingMfaSecret(tenantId: string, userId: string, secret: string): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.pendingMfaSecrets.set(`${tenantId}:${userId}`, secret);
      return;
    }

    const client = await this.getRedisClient(redisUrl);
    await client.set(`mfa:setup:${tenantId}:${userId}`, secret, 'EX', this.mfaTokenTtlSeconds);
  }

  private async consumePendingMfaSecret(tenantId: string, userId: string): Promise<string | null> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      const key = `${tenantId}:${userId}`;
      const secret = this.pendingMfaSecrets.get(key) ?? null;
      this.pendingMfaSecrets.delete(key);
      return secret;
    }

    const client = await this.getRedisClient(redisUrl);
    const key = `mfa:setup:${tenantId}:${userId}`;
    const secret = await client.get(key);
    if (secret) {
      await client.del(key);
    }

    return secret;
  }

  private assertTotpNotReplayed(lastUsedAt?: Date): void {
    if (!lastUsedAt) {
      return;
    }

    const windowSeconds = Number(this.configService.get<string>('MFA_TOTP_WINDOW') ?? '1');
    const windowMs = Math.max(1, windowSeconds) * 30 * 1000;
    if (Date.now() - lastUsedAt.getTime() < windowMs) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'MFA code already used',
      });
    }
  }
}
