import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantDocument, TenantStatus } from '../tenant/schemas/tenant.schema';
import { TokenService } from '../token/token.service';
import { AuthProvider, User, UserDocument, UserStatus } from '../users/schemas/user.schema';
import { resolveJwtRuntimeConfig } from '../auth/auth-runtime.config';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { GoogleStrategy } from '../auth/strategies/google.strategy';
import { MicrosoftStrategy } from '../auth/strategies/microsoft.strategy';
import type { OAuthProfile } from '../auth/strategies/google.strategy';

export type OAuthProvider = 'google' | 'microsoft';

// Extends Record<string,unknown> so it is assignment-compatible with the
// Mongoose schema type `Array<Record<string, unknown>>`.
interface OAuthAccountEntry extends Record<string, unknown> {
  provider: string;
  providerId: string;
  email: string;
  linkedAt: Date;
}

interface OAuthNonceData {
  tenantId: string;
  mode: 'login' | 'link';
  userId?: string;
}

interface OAuthStatePayload {
  tenantId: string;
  nonce: string;
}

interface RequestContext {
  ip: string;
  userAgent: string;
}

const ALLOWED_PROVIDERS: OAuthProvider[] = ['google', 'microsoft'];
const ALLOWED_TENANT_STATUSES: string[] = [TenantStatus.ACTIVE, TenantStatus.TRIAL];
const NONCE_TTL_SECONDS = 600; // 10 minutes

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private redisClient: Redis | null = null;
  private jwtFallbackWarningLogged = false;

  private readonly googleStrategy = new GoogleStrategy();
  private readonly microsoftStrategy = new MicrosoftStrategy();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly tokenService: TokenService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  // ─── Public Methods ────────────────────────────────────────────────────────

  /**
   * Validates the tenant and returns the OAuth provider's authorization URL.
   * Also generates and stores a CSRF nonce in Redis.
   */
  async initiateLogin(provider: string, tenantId: string): Promise<string> {
    this.assertProviderSupported(provider);

    const tenant = await this.tenantModel
      .findById(new Types.ObjectId(tenantId))
      .select('status isDeleted')
      .lean()
      .exec();

    if (!tenant || tenant.isDeleted || !ALLOWED_TENANT_STATUSES.includes(tenant.status)) {
      throw new ForbiddenException({
        code: 'TENANT_INACTIVE',
        message: 'Tenant not found or inactive',
      });
    }

    const nonce = randomBytes(32).toString('hex');
    const statePayload: OAuthStatePayload = { tenantId, nonce };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    await this.storeNonce(nonce, { tenantId, mode: 'login' });

    return this.buildAuthUrl(provider as OAuthProvider, state);
  }

  /**
   * Handles the OAuth callback: validates state/nonce, exchanges the code,
   * fetches the profile, finds or creates the user, issues JWT tokens.
   */
  async handleCallback(
    provider: string,
    code: string,
    stateParam: string,
    context: RequestContext,
  ) {
    this.assertProviderSupported(provider);

    // 1. Decode and verify state / nonce
    const { tenantId, nonce } = this.decodeState(stateParam);
    const nonceData = await this.consumeNonce(nonce);

    if (!nonceData) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Invalid or expired OAuth state',
      });
    }

    if (nonceData.tenantId !== tenantId) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_STATE',
        message: 'OAuth state tenant mismatch',
      });
    }

    // 2. Exchange code for profile
    const profile = await this.fetchProviderProfile(provider as OAuthProvider, code);

    // 3. Validate email
    if (!profile.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Provider email is not verified',
      });
    }

    // 4. Live tenant check
    const tenant = await this.tenantModel
      .findById(new Types.ObjectId(tenantId))
      .select('status isDeleted')
      .lean()
      .exec();

    if (!tenant || tenant.isDeleted || !ALLOWED_TENANT_STATUSES.includes(tenant.status)) {
      throw new ForbiddenException({
        code: 'TENANT_INACTIVE',
        message: 'Tenant is suspended or inactive',
      });
    }

    // 5. Find or create user
    const user = await this.findOrCreateUser(profile, tenantId, provider as OAuthProvider);

    // 6. Issue JWT + refresh token
    const access = this.signAccessToken(user);
    const refresh = await this.tokenService.createRefreshToken({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      deviceInfo: { ip: context.ip, userAgent: context.userAgent },
    });

    this.publishEvent('user.oauth_login', {
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      email: user.email,
      provider,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.refreshToken,
      refreshTokenExpiresAt: refresh.expiresAt,
      expiresIn: access.expiresIn,
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * Links an additional OAuth provider account to an already-authenticated user.
   * The caller must have previously initiated the link flow via initiateLinkFlow().
   */
  async linkAccount(
    userId: string,
    tenantId: string,
    provider: string,
    code: string,
    stateParam: string,
  ) {
    this.assertProviderSupported(provider);

    const { nonce } = this.decodeState(stateParam);
    const nonceData = await this.consumeNonce(nonce);

    if (!nonceData || nonceData.mode !== 'link' || nonceData.userId !== userId) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Invalid or expired link state',
      });
    }

    const profile = await this.fetchProviderProfile(provider as OAuthProvider, code);

    if (!profile.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Provider email is not verified',
      });
    }

    const user = await this.userModel
      .findOne({
        _id: new Types.ObjectId(userId),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .exec();

    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const existingAccounts = user.oauthAccounts as OAuthAccountEntry[];
    const alreadyLinked = existingAccounts.some(
      (a) => a.provider === provider && a.providerId === profile.providerId,
    );
    if (alreadyLinked) {
      throw new BadRequestException({
        code: 'ALREADY_LINKED',
        message: `${provider} account already linked`,
      });
    }

    this.appendOAuthAccount(user, profile, provider as OAuthProvider);
    if (user.authProvider === AuthProvider.LOCAL) {
      user.authProvider = AuthProvider.MIXED;
    }
    await user.save();

    return { success: true, data: { linked: true, provider } };
  }

  /**
   * Generates an initiation URL for the link flow (requires authenticated user).
   */
  async initiateLinkFlow(userId: string, tenantId: string, provider: string): Promise<string> {
    this.assertProviderSupported(provider);

    const nonce = randomBytes(32).toString('hex');
    const statePayload: OAuthStatePayload = { tenantId, nonce };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    await this.storeNonce(nonce, { tenantId, mode: 'link', userId });

    return this.buildAuthUrl(provider as OAuthProvider, state);
  }

  /**
   * Removes an OAuth provider account link from a user.
   * Prevents unlinking if it's the user's only authentication method.
   */
  async unlinkAccount(userId: string, tenantId: string, provider: string) {
    this.assertProviderSupported(provider);

    const user = await this.userModel
      .findOne({
        _id: new Types.ObjectId(userId),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .exec();

    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const accounts = user.oauthAccounts as OAuthAccountEntry[];
    const idx = accounts.findIndex((a) => a.provider === provider);

    if (idx === -1) {
      throw new BadRequestException({
        code: 'NOT_LINKED',
        message: `${provider} account is not linked`,
      });
    }

    const hasPassword =
      user.authProvider === AuthProvider.LOCAL || user.authProvider === AuthProvider.MIXED;
    const remainingOauth = accounts.filter((a) => a.provider !== provider);

    if (!hasPassword && remainingOauth.length === 0) {
      throw new BadRequestException({
        code: 'LAST_AUTH_METHOD',
        message: 'Cannot unlink the only authentication method',
      });
    }

    user.oauthAccounts = remainingOauth;

    // Update authProvider
    if (user.authProvider === AuthProvider.MIXED && remainingOauth.length === 0) {
      user.authProvider = AuthProvider.LOCAL;
    } else if (
      (user.authProvider === AuthProvider.GOOGLE && provider === 'google') ||
      (user.authProvider === AuthProvider.MICROSOFT && provider === 'microsoft')
    ) {
      user.authProvider =
        remainingOauth.length > 0 ? AuthProvider.MIXED : AuthProvider.LOCAL;
    }

    await user.save();

    return { success: true, data: { unlinked: true, provider } };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private assertProviderSupported(provider: string): asserts provider is OAuthProvider {
    if (!ALLOWED_PROVIDERS.includes(provider as OAuthProvider)) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_PROVIDER',
        message: `OAuth provider '${provider}' is not supported`,
      });
    }
  }

  private buildAuthUrl(provider: OAuthProvider, state: string): string {
    if (provider === 'google') {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
      const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? '';
      return this.googleStrategy.buildAuthUrl(clientId, redirectUri, state);
    }

    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') ?? '';
    const redirectUri = this.configService.get<string>('MICROSOFT_CALLBACK_URL') ?? '';
    return this.microsoftStrategy.buildAuthUrl(clientId, redirectUri, state);
  }

  private async fetchProviderProfile(
    provider: OAuthProvider,
    code: string,
  ): Promise<OAuthProfile> {
    if (provider === 'google') {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
      const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? '';
      const accessToken = await this.googleStrategy.exchangeCode(
        code,
        clientId,
        clientSecret,
        redirectUri,
      );
      return this.googleStrategy.getProfile(accessToken);
    }

    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') ?? '';
    const clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET') ?? '';
    const redirectUri = this.configService.get<string>('MICROSOFT_CALLBACK_URL') ?? '';
    const accessToken = await this.microsoftStrategy.exchangeCode(
      code,
      clientId,
      clientSecret,
      redirectUri,
    );
    return this.microsoftStrategy.getProfile(accessToken);
  }

  private decodeState(stateParam: string): OAuthStatePayload {
    try {
      const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded) as OAuthStatePayload;
      if (!parsed.tenantId || !parsed.nonce) throw new Error('Missing fields');
      return parsed;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Malformed OAuth state parameter',
      });
    }
  }

  private async findOrCreateUser(
    profile: OAuthProfile,
    tenantId: string,
    provider: OAuthProvider,
  ): Promise<UserDocument> {
    const tid = new Types.ObjectId(tenantId);

    // 1. Lookup by providerId (returning user)
    let user = await this.userModel
      .findOne({
        tenantId: tid,
        'oauthAccounts.provider': provider,
        'oauthAccounts.providerId': profile.providerId,
        isDeleted: false,
      })
      .exec();

    if (user) {
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }

    // 2. Lookup by email (existing LOCAL user → link)
    user = await this.userModel
      .findOne({
        tenantId: tid,
        email: profile.email.toLowerCase(),
        isDeleted: false,
      })
      .exec();

    if (user) {
      this.appendOAuthAccount(user, profile, provider);
      if (user.authProvider === AuthProvider.LOCAL) {
        user.authProvider = AuthProvider.MIXED;
      }
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }

    // 3. Auto-create new user
    const providerEnum =
      provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.MICROSOFT;

    const newUser = await this.userModel.create({
      tenantId: tid,
      email: profile.email.toLowerCase(),
      fullName: profile.fullName,
      // Unusable password placeholder — OAuth-only users cannot log in with a password.
      passwordHash: `oauth:${randomBytes(32).toString('hex')}`,
      avatarUrl: profile.avatarUrl,
      authProvider: providerEnum,
      status: UserStatus.ACTIVE,
      roles: ['user'],
      oauthAccounts: [
        {
          provider,
          providerId: profile.providerId,
          email: profile.email,
          linkedAt: new Date(),
        },
      ],
      mfaEnabled: false,
      isDeleted: false,
      failedLoginCount: 0,
      locale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
    });

    this.publishEvent('user.created', {
      tenantId,
      userId: newUser._id.toString(),
      email: newUser.email,
      authProvider: providerEnum,
      timestamp: new Date().toISOString(),
    });

    return newUser;
  }

  private appendOAuthAccount(
    user: UserDocument,
    profile: OAuthProfile,
    provider: OAuthProvider,
  ): void {
    const accounts = (user.oauthAccounts as OAuthAccountEntry[]).filter(
      (a) => !(a.provider === provider && a.providerId === profile.providerId),
    );
    accounts.push({
      provider,
      providerId: profile.providerId,
      email: profile.email,
      linkedAt: new Date(),
    });
    user.oauthAccounts = accounts;
  }

  private signAccessToken(user: UserDocument): { token: string; expiresIn: number } {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const jwtConfig = resolveJwtRuntimeConfig(this.configService);
    const jti = uuidv4();

    if (!this.jwtFallbackWarningLogged && jwtConfig.warning && jwtConfig.usedFallback) {
      this.jwtFallbackWarningLogged = true;
      this.logger.warn(jwtConfig.warning);
    }

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

    return { token, expiresIn: this.durationToSeconds(expiresIn) };
  }

  private durationToSeconds(input: string): number {
    if (/^\d+$/.test(input)) return Number(input);
    const match = input.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 3600;
    return value * 86400;
  }

  private async storeNonce(nonce: string, data: OAuthNonceData): Promise<void> {
    const redis = await this.getRedisClient();
    if (!redis) return;
    await redis.set(`oauth:nonce:${nonce}`, JSON.stringify(data), 'EX', NONCE_TTL_SECONDS);
  }

  private async consumeNonce(nonce: string): Promise<OAuthNonceData | null> {
    const redis = await this.getRedisClient();
    if (!redis) return null;

    const raw = await redis.get(`oauth:nonce:${nonce}`);
    if (!raw) return null;

    await redis.del(`oauth:nonce:${nonce}`);

    try {
      return JSON.parse(raw) as OAuthNonceData;
    } catch {
      return null;
    }
  }

  private async getRedisClient(): Promise<Redis | null> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured — OAuth CSRF nonce protection is disabled',
      );
      return null;
    }

    if (this.redisClient) return this.redisClient;

    this.redisClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });

    await this.redisClient.connect().catch(() => {
      this.redisClient = null;
      throw new Error('Redis connection failed — cannot issue OAuth nonce');
    });

    return this.redisClient;
  }

  private publishEvent(routingKey: string, payload: Record<string, unknown>): void {
    this.rabbitMQService.publish(routingKey, payload).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(`Failed to publish ${routingKey}: ${msg}`);
    });
  }
}
