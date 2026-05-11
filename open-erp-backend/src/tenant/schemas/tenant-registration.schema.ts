import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TenantRegistrationDocument = HydratedDocument<TenantRegistration>;

export enum RegistrationStatus {
  PENDING_EMAIL_ACTIVATION = 'PENDING_EMAIL_ACTIVATION',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true, collection: 'tenant_registrations' })
export class TenantRegistration {
  @Prop({ required: true, trim: true })
  taxCode!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  subdomain!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ default: false })
  taxVerified!: boolean;

  @Prop({ type: Object })
  taxInfo?: Record<string, unknown>;

  @Prop({ required: true })
  activationToken!: string;

  @Prop({ type: Date, required: true })
  activationTokenExpiresAt!: Date;

  @Prop({
    type: String,
    enum: Object.values(RegistrationStatus),
    default: RegistrationStatus.PENDING_EMAIL_ACTIVATION,
  })
  status!: RegistrationStatus;

  @Prop({ type: Types.ObjectId })
  tenantId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expiredAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TenantRegistrationSchema =
  SchemaFactory.createForClass(TenantRegistration);

TenantRegistrationSchema.index({ taxCode: 1 }, { unique: true });
TenantRegistrationSchema.index({ subdomain: 1 });
TenantRegistrationSchema.index({ status: 1 });
TenantRegistrationSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
