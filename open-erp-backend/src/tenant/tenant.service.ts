import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { MST_VERIFICATION_ADAPTER } from './adapters/mst-verification.adapter';
import type { MSTVerificationAdapter } from './adapters/mst-verification.adapter';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { VerifyTaxCodeDto } from './dto/verify-tax-code.dto';
import { OnboardingService } from './onboarding/onboarding.service';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';
import {
  RegistrationStatus,
  TenantRegistration,
  TenantRegistrationDocument,
} from './schemas/tenant-registration.schema';
import {
  Tenant,
  TenantDocument,
  TenantPlan,
  TenantStatus,
  TenantVerificationMethod,
} from './schemas/tenant.schema';
import {
  TenantUsageHistory,
  TenantUsageHistoryDocument,
} from './schemas/tenant-usage-history.schema';
import {
  TAX_CODE_REGEX,
  TENANT_SUBDOMAIN_BLACKLIST,
  TENANT_SUBDOMAIN_REGEX,
} from './tenant.constants';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class TenantService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantService.name);
  private redisClient: Redis | null = null;
  private readonly expiredTrialIntervalMs = 60 * 60 * 1000;
  private expiredTrialSweepTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly onboardingService: OnboardingService,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(TenantRegistration.name)
    private readonly tenantRegistrationModel: Model<TenantRegistrationDocument>,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlanDocument>,
    @InjectModel(TenantUsageHistory.name)
    private readonly tenantUsageHistoryModel: Model<TenantUsageHistoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<any>,
    @Inject(MST_VERIFICATION_ADAPTER)
    private readonly mstAdapter: MSTVerificationAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSubscriptionPlans();
    await this.suspendExpiredTrials().catch((error) => {
      this.logger.warn(`Failed to sweep expired trials on startup: ${this.describeError(error)}`);
    });

    this.expiredTrialSweepTimer = setInterval(() => {
      this.suspendExpiredTrials().catch((error) => {
        this.logger.warn(`Failed to sweep expired trials: ${this.describeError(error)}`);
      });
    }, this.expiredTrialIntervalMs);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.expiredTrialSweepTimer) {
      clearInterval(this.expiredTrialSweepTimer);
      this.expiredTrialSweepTimer = null;
    }

    if (this.redisClient) {
      await this.redisClient.quit().catch(() => undefined);
      this.redisClient = null;
    }
  }

  async register(dto: RegisterTenantDto) {
    const taxCode = dto.taxCode.trim();
    const email = dto.email.trim().toLowerCase();
    const subdomain = dto.subdomain.trim().toLowerCase();

    this.assertTaxCode(taxCode);
    this.assertSubdomain(subdomain);

    await this.ensureTaxCodeNotExists(taxCode);
    await this.ensureSubdomainNotExists(subdomain);

    const now = Date.now();
    const activationToken = uuidv4();

    const registration = await this.tenantRegistrationModel.create({
      taxCode,
      subdomain,
      email,
      activationToken,
      activationTokenExpiresAt: new Date(now + 30 * 60 * 1000),
      status: RegistrationStatus.PENDING_EMAIL_ACTIVATION,
      expiredAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      success: true,
      data: {
        registrationId: registration.id,
        activationTokenExpiresAt: registration.activationTokenExpiresAt,
        status: registration.status,
      },
    };
  }

  async activateRegistration(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.registration.activation_token_required', data: {} },
      });
    }

    const registration = await this.tenantRegistrationModel
      .findOne({ activationToken: token.trim() })
      .exec();

    if (!registration) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.registration.not_found', data: {} },
      });
    }

    if (registration.activationTokenExpiresAt.getTime() <= Date.now()) {
      registration.status = RegistrationStatus.EXPIRED;
      await registration.save();
      throw new GoneException({
        code: 'TOKEN_EXPIRED',
        message: { key: 'tenant.registration.activation_token_expired', data: {} },
      });
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'tenant.registration.already_completed', data: {} },
      });
    }

    registration.status = RegistrationStatus.EMAIL_VERIFIED;
    await registration.save();

    return {
      success: true,
      data: {
        registrationId: registration.id,
        status: registration.status,
      },
    };
  }

  async verifyTaxCode(dto: VerifyTaxCodeDto) {
    const taxCode = dto.taxCode.trim();
    const email = dto.email.trim().toLowerCase();
    this.assertTaxCode(taxCode);

    const registration = await this.tenantRegistrationModel
      .findOne({ taxCode, email })
      .exec();

    if (!registration) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.registration.not_found', data: {} },
      });
    }

    if (registration.status !== RegistrationStatus.EMAIL_VERIFIED) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          key: 'tenant.registration.invalid_state',
          data: { status: registration.status },
        },
      });
    }

    const taxInfo = await this.mstAdapter.lookupByTaxCode(taxCode);
    if (!taxInfo || taxInfo.status !== 'ACTIVE') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.tax_code.invalid_or_inactive', data: {} },
      });
    }

    const emailMatch = await this.mstAdapter.verifyEmailMatch(taxCode, email);
    if (!emailMatch) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'tenant.registration.email_mismatch_tax_info', data: {} },
      });
    }

    registration.taxVerified = true;
    registration.taxInfo = taxInfo as unknown as Record<string, unknown>;
    await registration.save();

    return {
      success: true,
      data: taxInfo,
    };
  }

  async completeOnboarding(dto: CompleteOnboardingDto) {
    const registration = await this.tenantRegistrationModel
      .findById(dto.registrationId)
      .exec();

    if (!registration || registration.status !== RegistrationStatus.EMAIL_VERIFIED) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.registration.invalid_state', data: {} },
      });
    }

    if (!registration.taxVerified) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'tenant.registration.tax_verification_required', data: {} },
      });
    }

    const tenantByTaxCode = await this.tenantModel
      .exists({ taxCode: registration.taxCode, isDeleted: false })
      .then(Boolean);
    if (tenantByTaxCode) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'tenant.tax_code.duplicate', data: {} },
      });
    }

    const existingBySubdomain = await this.tenantModel
      .findOne({ subdomain: registration.subdomain, isDeleted: false })
      .select('_id')
      .lean()
      .exec();

    if (existingBySubdomain) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'tenant.subdomain.duplicate', data: {} },
      });
    }

    const requireManualReview =
      (this.configService.get<string>('REQUIRE_MANUAL_REVIEW') ?? 'false') === 'true';
    const status = requireManualReview
      ? TenantStatus.PENDING_VERIFICATION
      : TenantStatus.TRIAL;

    const tenant = await this.tenantModel.create({
      companyName: dto.companyName?.trim() || `Cong ty ${registration.taxCode}`,
      subdomain: registration.subdomain,
      slug: registration.subdomain,
      taxCode: registration.taxCode,
      taxVerified: Boolean(registration.taxVerified),
      taxInfo: registration.taxInfo,
      registrationEmail: registration.email,
      verificationMethod: TenantVerificationMethod.SELF_REGISTER,
      status,
      plan: TenantPlan.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      adminEmail: registration.email,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        locale: 'vi-VN',
        currency: 'VND',
        sessionTimeoutMinutes: 480,
      },
      isDeleted: false,
    });

    registration.status = RegistrationStatus.COMPLETED;
    registration.tenantId = tenant._id as Types.ObjectId;
    await registration.save();

    const onboarding = await this.onboardingService.initializeTenant(tenant, registration);

    // Publish tenant.registered immediately after tenant record is created.
    // tenant.created is published only after the Onboarding Wizard completes (via finalizeWizard).
    this.publishFireAndForget('tenant.registered', {
      tenantId: tenant.id,
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
    });

    return {
      success: true,
      data: {
        id: tenant.id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        status: tenant.status,
        plan: tenant.plan,
        trialEndsAt: tenant.trialEndsAt,
        onboarding,
      },
    };
  }

  /**
   * finalizeWizard — Called after the Onboarding Wizard (5-step) completes.
   * Publishes tenant.created so downstream services (user-service, rbac-service, catalog-service)
   * can initialize their default data.
   */
  async finalizeWizard(tenantId: string) {
    const tenant = await this.tenantModel
      .findOne({ _id: tenantId, isDeleted: false })
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    this.publishFireAndForget('tenant.created', {
      tenantId: tenant._id.toString(),
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
    });

    return { success: true, data: { tenantId: tenant._id.toString() } };
  }

  async listTenants(query: ListTenantsQueryDto, user?: Express.User) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.status) {
      filter.status = query.status;
    }

    if (!this.isSuperAdmin(user)) {
      const tenantId = this.resolveTenantId(undefined, user);
      filter._id = new Types.ObjectId(tenantId);
    }

    const [items, total] = await Promise.all([
      this.tenantModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.tenantModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantById(id: string, user?: Express.User) {
    this.assertTenantAccess(id, user);

    const tenant = await this.tenantModel.findById(id).lean().exec();
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    return { success: true, data: tenant };
  }

  async updateTenant(id: string, user: Express.User | undefined, dto: UpdateTenantDto) {
    this.assertTenantAccess(id, user);

    const tenant = await this.tenantModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: dto }, { new: true })
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    return { success: true, data: tenant };
  }

  async deleteTenant(id: string, user?: Express.User): Promise<void> {
    this.assertSuperAdmin(user);

    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    tenant.isDeleted = true;
    tenant.status = TenantStatus.TERMINATED;
    await tenant.save();
  }

  async updateTenantPlan(
    id: string,
    user: Express.User | undefined,
    plan: TenantPlan,
  ) {
    this.assertSuperAdmin(user);

    const tenant = await this.tenantModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { plan } }, { new: true })
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    return { success: true, data: tenant };
  }

  async updateTenantSubscription(
    id: string,
    user: Express.User | undefined,
    planCode: string,
  ) {
    this.assertSuperAdmin(user);

    const plan = await this.subscriptionPlanModel
      .findOne({ code: planCode.toUpperCase(), isActive: true })
      .lean()
      .exec();

    if (!plan) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.plan.not_found', data: {} },
      });
    }

    const tenant = await this.tenantModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          $set: {
            plan: plan.code as TenantPlan,
            quotas: plan.quotas,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    await this.resetQuotaAlerts(id);

    return { success: true, data: tenant };
  }

  async listSubscriptionPlans() {
    const plans = await this.subscriptionPlanModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();

    return { success: true, data: plans };
  }

  async getTenantUsage(idOrTenantId: string | undefined, user?: Express.User) {
    const tenantId = idOrTenantId ?? this.resolveTenantId(undefined, user);
    this.assertTenantAccess(tenantId, user);

    const tenant = await this.tenantModel.findById(tenantId).lean().exec();
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    const usage = await this.resolveUsageSnapshot(tenantId, tenant);
    const alerts = await this.getQuotaAlerts(tenantId);

    return {
      success: true,
      data: {
        plan: tenant.plan,
        quotas: tenant.quotas ?? {},
        usage,
        alerts,
      },
    };
  }

  async getTenantUsageHistory(idOrTenantId: string | undefined, user?: Express.User) {
    const tenantId = idOrTenantId ?? this.resolveTenantId(undefined, user);
    this.assertTenantAccess(tenantId, user);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 29);
    fromDate.setHours(0, 0, 0, 0);

    const items = await this.tenantUsageHistoryModel
      .find({ tenantId: new Types.ObjectId(tenantId), date: { $gte: fromDate } })
      .sort({ date: 1 })
      .lean()
      .exec();

    const byDay = new Map(
      items.map((item) => [this.toDayKey(item.date), item]),
    );
    const history = Array.from({ length: 30 }, (_value, index) => {
      const date = new Date(fromDate);
      date.setDate(fromDate.getDate() + index);
      const key = this.toDayKey(date);
      const current = byDay.get(key);

      return {
        date: key,
        apiCalls: current?.apiCalls ?? 0,
        activeUsers: current?.activeUsers ?? 0,
        storageBytes: current?.storageBytes ?? 0,
      };
    });

    return { success: true, data: history };
  }

  async enforceApiQuota(tenantId: string, routePath: string): Promise<void> {
    const tenant = await this.tenantModel
      .findById(tenantId)
      .select('_id status plan quotas trialEndsAt isDeleted')
      .lean()
      .exec();

    if (!tenant || tenant.isDeleted) {
      return;
    }

    if (tenant.status === TenantStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: { key: 'tenant.pending_verification.blocked', data: { routePath } },
      });
    }

    if (tenant.status === TenantStatus.TRIAL && tenant.trialEndsAt && tenant.trialEndsAt.getTime() <= Date.now()) {
      await this.markTenantSuspended(tenantId, tenant);
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: { key: 'tenant.trial.expired', data: {} },
      });
    }

    const plan = await this.resolvePlanQuota(tenant.plan, tenant.quotas);
    const count = await this.incrementApiCounter(tenantId);

    if (plan.maxApiCallsPerDay !== null && count > plan.maxApiCallsPerDay) {
      throw new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          message: {
            key: 'tenant.quota.api_exceeded',
            data: { tenantId, count, limit: plan.maxApiCallsPerDay },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const percent = this.calculatePercent(count, plan.maxApiCallsPerDay);
    if (percent >= 80) {
      await this.publishQuotaAlertOnce(tenantId, 'API_QUOTA_80', percent);
    }

    await this.recordUsageHistorySnapshot(tenantId, {
      apiCalls: count,
      activeUsers: await this.countActiveUsers(tenantId),
      storageBytes: tenant.usageStats?.usedStorageBytes ?? 0,
    });
  }

  async suspendExpiredTrials(): Promise<void> {
    const expiredTenants = await this.tenantModel
      .find({
        isDeleted: false,
        status: TenantStatus.TRIAL,
        trialEndsAt: { $lte: new Date() },
      })
      .select('_id adminEmail')
      .lean()
      .exec();

    for (const tenant of expiredTenants) {
      await this.markTenantSuspended(String(tenant._id), tenant);
    }
  }

  async approveTenant(id: string, user?: Express.User) {
    this.assertTenantAccess(id, user);
    const tenant = await this.tenantModel.findById(id).exec();

    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    if (tenant.status !== TenantStatus.PENDING_VERIFICATION) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'tenant.approve.invalid_status', data: { status: tenant.status } },
      });
    }

    tenant.status = TenantStatus.TRIAL;
    await tenant.save();

    return { success: true, data: { id: tenant.id, status: tenant.status } };
  }

  async activateTenant(id: string, user?: Express.User) {
    this.assertTenantAccess(id, user);
    const tenant = await this.tenantModel.findById(id).exec();

    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    if (tenant.status === TenantStatus.TERMINATED) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'tenant.activate.terminated', data: {} },
      });
    }

    tenant.status = TenantStatus.ACTIVE;
    await tenant.save();

    return { success: true, data: { id: tenant.id, status: tenant.status } };
  }

  async suspendTenant(id: string, user?: Express.User) {
    this.assertTenantAccess(id, user);
    const tenant = await this.tenantModel.findById(id).exec();

    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    if (tenant.status === TenantStatus.TERMINATED) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'tenant.suspend.terminated', data: {} },
      });
    }

    tenant.status = TenantStatus.SUSPENDED;
    await tenant.save();

    this.publishFireAndForget('tenant.suspended', {
      tenantId: tenant.id,
      adminEmail: tenant.adminEmail,
    });

    return { success: true, data: { id: tenant.id, status: tenant.status } };
  }

  async getMyTenant(requestTenantId: string | undefined, user?: Express.User) {
    const tenantId = this.resolveTenantId(requestTenantId, user);
    return this.getTenantById(tenantId, user);
  }

  async updateMySettings(
    requestTenantId: string | undefined,
    user: Express.User | undefined,
    dto: UpdateTenantSettingsDto,
  ) {
    const tenantId = this.resolveTenantId(requestTenantId, user);

    const tenant = await this.tenantModel
      .findOneAndUpdate(
        { _id: tenantId, isDeleted: false },
        { $set: { settings: dto } },
        { new: true },
      )
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    return { success: true, data: tenant.settings ?? {} };
  }

  async getMySettings(requestTenantId: string | undefined, user?: Express.User) {
    const tenantId = this.resolveTenantId(requestTenantId, user);
    const tenant = await this.tenantModel
      .findOne({ _id: tenantId, isDeleted: false })
      .select('settings')
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    return { success: true, data: tenant.settings ?? {} };
  }

  private assertTaxCode(taxCode: string): void {
    if (!TAX_CODE_REGEX.test(taxCode)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.tax_code.invalid_format', data: {} },
      });
    }
  }

  private assertSubdomain(subdomain: string): void {
    if (!TENANT_SUBDOMAIN_REGEX.test(subdomain)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.subdomain.invalid_format', data: {} },
      });
    }

    if (
      subdomain.startsWith('-') ||
      subdomain.endsWith('-') ||
      TENANT_SUBDOMAIN_BLACKLIST.has(subdomain)
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: { key: 'tenant.subdomain.blocked', data: {} },
      });
    }
  }

  private async ensureTaxCodeNotExists(taxCode: string): Promise<void> {
    const [tenantExists, registrationExists] = await Promise.all([
      this.tenantModel.exists({ taxCode, isDeleted: false }),
      this.tenantRegistrationModel.exists({
        taxCode,
        status: { $ne: RegistrationStatus.EXPIRED },
      }),
    ]);

    if (tenantExists || registrationExists) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'tenant.tax_code.duplicate', data: {} },
      });
    }
  }

  private async ensureSubdomainNotExists(subdomain: string): Promise<void> {
    const existing = await this.tenantModel
      .exists({ subdomain, isDeleted: false })
      .then(Boolean);

    if (existing) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'tenant.subdomain.duplicate', data: {} },
      });
    }
  }

  private resolveTenantId(
    requestTenantId: string | undefined,
    user?: Express.User,
  ): string {
    const tenantId = user?.tenantId ?? requestTenantId;
    if (!tenantId) {
      throw new HttpException(
        {
          code: 'UNAUTHORIZED',
          message: { key: 'tenant.context.missing', data: {} },
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return tenantId;
  }

  private assertTenantAccess(id: string, user?: Express.User): void {
    if (this.isSuperAdmin(user)) {
      return;
    }

    if (!user?.tenantId || user.tenantId !== id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: { key: 'tenant.access.denied', data: {} },
      });
    }
  }

  private isSuperAdmin(user?: Express.User): boolean {
    return (user?.roles ?? []).includes('SUPER_ADMIN');
  }

  private assertSuperAdmin(user?: Express.User): void {
    if (this.isSuperAdmin(user)) {
      return;
    }

    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: { key: 'tenant.access.denied', data: {} },
    });
  }

  private publishFireAndForget(routingKey: string, payload: object): void {
    this.rabbitMQService.publish(routingKey, payload).catch(() => undefined);
  }

  private async seedSubscriptionPlans(): Promise<void> {
    const plans = [
      {
        code: TenantPlan.TRIAL,
        name: 'Trial',
        price: 0,
        quotas: { maxUsers: 5, maxStorageBytes: 512 * 1024 * 1024, maxApiCallsPerDay: 1000 },
        features: ['all-modules'],
        enabledModules: ['all'],
        displayOrder: 1,
      },
      {
        code: TenantPlan.STARTER,
        name: 'Starter',
        price: 500000,
        quotas: { maxUsers: 20, maxStorageBytes: 10 * 1024 * 1024 * 1024, maxApiCallsPerDay: 10000 },
        features: ['hr', 'sale', 'office'],
        enabledModules: ['hr', 'sale', 'office'],
        displayOrder: 2,
      },
      {
        code: TenantPlan.BUSINESS,
        name: 'Business',
        price: 2000000,
        quotas: { maxUsers: 100, maxStorageBytes: 50 * 1024 * 1024 * 1024, maxApiCallsPerDay: 100000 },
        features: ['all-modules'],
        enabledModules: ['all'],
        displayOrder: 3,
      },
      {
        code: TenantPlan.ENTERPRISE,
        name: 'Enterprise',
        price: 0,
        quotas: { maxUsers: null, maxStorageBytes: null, maxApiCallsPerDay: null },
        features: ['all-modules', 'custom'],
        enabledModules: ['all'],
        displayOrder: 4,
      },
    ];

    for (const plan of plans) {
      await this.subscriptionPlanModel.updateOne(
        { code: plan.code },
        { $setOnInsert: plan },
        { upsert: true },
      ).exec();
    }
  }

  private async resolveUsageSnapshot(tenantId: string, tenant: any) {
    const [currentUsers, apiCallsToday] = await Promise.all([
      this.countActiveUsers(tenantId),
      this.getApiCounter(tenantId),
    ]);

    const maxUsers = tenant.quotas?.maxUsers ?? null;
    const maxStorageBytes = tenant.quotas?.maxStorageBytes ?? null;
    const maxApiCallsPerDay = tenant.quotas?.maxApiCallsPerDay ?? null;

    const usedStorageBytes = tenant.usageStats?.usedStorageBytes ?? 0;

    await this.recordUsageHistorySnapshot(tenantId, {
      apiCalls: apiCallsToday,
      activeUsers: currentUsers,
      storageBytes: usedStorageBytes,
    });

    return {
      users: currentUsers,
      usersPercent: this.calculatePercent(currentUsers, maxUsers),
      storageBytes: usedStorageBytes,
      storagePercent: this.calculatePercent(usedStorageBytes, maxStorageBytes),
      apiCallsToday,
      apiCallsPercent: this.calculatePercent(apiCallsToday, maxApiCallsPerDay),
    };
  }

  private async countActiveUsers(tenantId: string): Promise<number> {
    return this.userModel.countDocuments({ tenantId: new Types.ObjectId(tenantId), isDeleted: false }).exec();
  }

  private async incrementApiCounter(tenantId: string): Promise<number> {
    const client = await this.getRedisClient();
    if (!client) {
      const tenant = await this.tenantModel.findById(tenantId).lean().exec();
      return tenant?.usageStats?.apiCallsToday ? tenant.usageStats.apiCallsToday + 1 : 1;
    }

    const key = `quota:api:${tenantId}`;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 60 * 60 * 24);
    }

    await this.tenantModel.updateOne(
      { _id: tenantId },
      { $set: { 'usageStats.apiCallsToday': count, 'usageStats.lastCalculatedAt': new Date() } },
    ).exec();

    return count;
  }

  private async getApiCounter(tenantId: string): Promise<number> {
    const client = await this.getRedisClient();
    if (!client) {
      const tenant = await this.tenantModel.findById(tenantId).lean().exec();
      return tenant?.usageStats?.apiCallsToday ?? 0;
    }

    const value = await client.get(`quota:api:${tenantId}`).catch(() => null);
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async getRedisClient(): Promise<Redis | null> {
    if (this.redisClient) {
      return this.redisClient;
    }

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null;
    }

    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    await this.redisClient.connect().catch(() => {
      this.redisClient = null;
    });

    return this.redisClient;
  }

  private async publishQuotaAlertOnce(
    tenantId: string,
    alertCode: string,
    percent: number,
  ): Promise<void> {
    const client = await this.getRedisClient();
    const key = `quota:alert:${tenantId}:${alertCode}`;
    if (client) {
      const existing = await client.get(key).catch(() => null);
      if (existing) {
        return;
      }
      await client.set(key, '1', 'EX', 60 * 60 * 24);
    }

    this.publishFireAndForget('tenant.quota.alert', {
      tenantId,
      alertCode,
      percent,
      timestamp: new Date().toISOString(),
    });
  }

  private async getQuotaAlerts(tenantId: string): Promise<string[]> {
    const client = await this.getRedisClient();
    if (!client) {
      return [];
    }

    const keys = await client.keys(`quota:alert:${tenantId}:*`).catch(() => []);
    return keys.map((key) => key.split(':').slice(-1)[0]).filter(Boolean);
  }

  private async resetQuotaAlerts(tenantId: string): Promise<void> {
    const client = await this.getRedisClient();
    if (!client) {
      return;
    }

    const keys = await client.keys(`quota:alert:${tenantId}:*`).catch(() => []);
    if (keys.length > 0) {
      await client.del(...keys).catch(() => undefined);
    }
  }

  private calculatePercent(value: number, limit: number | null | undefined): number {
    if (!limit || limit <= 0) {
      return 0;
    }

    return Number(((value / limit) * 100).toFixed(2));
  }

  private async recordUsageHistorySnapshot(
    tenantId: string,
    snapshot: { apiCalls: number; activeUsers: number; storageBytes: number },
  ): Promise<void> {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    await this.tenantUsageHistoryModel
      .updateOne(
        { tenantId: new Types.ObjectId(tenantId), date },
        {
          $set: {
            apiCalls: snapshot.apiCalls,
            activeUsers: snapshot.activeUsers,
            storageBytes: snapshot.storageBytes,
          },
          $setOnInsert: {
            tenantId: new Types.ObjectId(tenantId),
            date,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  private async resolvePlanQuota(
    plan: TenantPlan,
    tenantQuotas?: { maxUsers?: number | null; maxStorageBytes?: number | null; maxApiCallsPerDay?: number | null },
  ) {
    const defaultQuotas = {
      [TenantPlan.TRIAL]: { maxUsers: 5, maxStorageBytes: 512 * 1024 * 1024, maxApiCallsPerDay: 1000 },
      [TenantPlan.STARTER]: { maxUsers: 20, maxStorageBytes: 10 * 1024 * 1024 * 1024, maxApiCallsPerDay: 10000 },
      [TenantPlan.BUSINESS]: { maxUsers: 100, maxStorageBytes: 50 * 1024 * 1024 * 1024, maxApiCallsPerDay: 100000 },
      [TenantPlan.ENTERPRISE]: { maxUsers: null, maxStorageBytes: null, maxApiCallsPerDay: null },
    } as const;

    const fallback = defaultQuotas[plan] ?? defaultQuotas[TenantPlan.TRIAL];
    return {
      maxUsers: tenantQuotas?.maxUsers ?? fallback.maxUsers,
      maxStorageBytes: tenantQuotas?.maxStorageBytes ?? fallback.maxStorageBytes,
      maxApiCallsPerDay: tenantQuotas?.maxApiCallsPerDay ?? fallback.maxApiCallsPerDay,
    };
  }

  private async markTenantSuspended(tenantId: string, tenant: { _id?: Types.ObjectId; adminEmail?: string }): Promise<void> {
    await this.tenantModel.updateOne(
      { _id: tenantId },
      { $set: { status: TenantStatus.SUSPENDED } },
    ).exec();

    this.publishFireAndForget('tenant.suspended', {
      tenantId: tenantId.toString(),
      adminEmail: tenant.adminEmail,
      reason: 'TRIAL_EXPIRED',
    });
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown';
  }

  private toDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
