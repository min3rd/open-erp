import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

export enum TenantStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_SETUP = 'PENDING_SETUP',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum TenantPlan {
  TRIAL = 'TRIAL',
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantVerificationMethod {
  SELF_REGISTER = 'SELF_REGISTER',
  ADMIN_CREATED = 'ADMIN_CREATED',
}

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, trim: true, maxlength: 200 })
  companyName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  subdomain!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ trim: true })
  taxCode?: string;

  @Prop({ default: false })
  taxVerified!: boolean;

  @Prop({ type: Object })
  taxInfo?: Record<string, unknown>;

  @Prop({ lowercase: true, trim: true })
  registrationEmail?: string;

  @Prop({
    type: String,
    enum: Object.values(TenantVerificationMethod),
    default: TenantVerificationMethod.SELF_REGISTER,
  })
  verificationMethod!: TenantVerificationMethod;

  @Prop({
    type: String,
    enum: Object.values(TenantStatus),
    default: TenantStatus.PENDING_VERIFICATION,
  })
  status!: TenantStatus;

  @Prop({ type: String, enum: Object.values(TenantPlan), default: TenantPlan.TRIAL })
  plan!: TenantPlan;

  @Prop({
    type: Object,
    default: {
      maxUsers: 5,
      maxStorageBytes: 512 * 1024 * 1024,
      maxApiCallsPerDay: 1000,
    },
  })
  quotas!: {
    maxUsers?: number | null;
    maxStorageBytes?: number | null;
    maxApiCallsPerDay?: number | null;
  };

  @Prop({
    type: Object,
    default: {
      currentUsers: 0,
      usedStorageBytes: 0,
      apiCallsToday: 0,
      lastCalculatedAt: null,
    },
  })
  usageStats!: {
    currentUsers?: number;
    usedStorageBytes?: number;
    apiCallsToday?: number;
    lastCalculatedAt?: Date | null;
  };

  @Prop({ type: Date })
  trialEndsAt?: Date;

  @Prop({ type: Date })
  subscriptionEndsAt?: Date;

  @Prop({ type: Object, default: {} })
  settings!: Record<string, unknown>;

  @Prop({ required: true, lowercase: true, trim: true })
  adminEmail!: string;

  @Prop({ default: false })
  isDeleted!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ subdomain: 1 }, { unique: true });
TenantSchema.index({ taxCode: 1 }, { unique: true, sparse: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ plan: 1 });
TenantSchema.index({ trialEndsAt: 1 });
TenantSchema.index({ subscriptionEndsAt: 1 });
