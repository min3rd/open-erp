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
import Redis from 'ioredis';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { TokenService } from '../token/token.service';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';
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

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private redisClient: Redis | null = null;
  private jwtFallbackWarningLogged = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly tokenService: TokenService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

    if (user.tenantStatus && !['ACTIVE', 'TRIAL'].includes(user.tenantStatus)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tenant is not active',
      });
    }

    if (user.mfaEnabled) {
      return {
        success: true,
        data: {
          mfaRequired: true,
          sessionToken: uuidv4(),
        },
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
}
