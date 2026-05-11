import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
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
  TAX_CODE_REGEX,
  TENANT_SUBDOMAIN_BLACKLIST,
  TENANT_SUBDOMAIN_REGEX,
} from './tenant.constants';

@Injectable()
export class TenantService {
  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly onboardingService: OnboardingService,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(TenantRegistration.name)
    private readonly tenantRegistrationModel: Model<TenantRegistrationDocument>,
    @Inject(MST_VERIFICATION_ADAPTER)
    private readonly mstAdapter: MSTVerificationAdapter,
  ) {}

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
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { plan } },
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

    return { success: true, data: tenant };
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
}
