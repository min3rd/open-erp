import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  MIXED = 'MIXED',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ type: Object })
  avatarMetadata?: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, index: true })
  departmentId?: Types.ObjectId;

  @Prop({ trim: true })
  positionTitle?: string;

  @Prop({ type: Types.ObjectId, index: true })
  managerId?: Types.ObjectId;

  @Prop({ trim: true })
  employeeCode?: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING_ACTIVATION,
    index: true,
  })
  status!: UserStatus;

  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop()
  mfaSecret?: string;

  @Prop({ type: [String], default: [] })
  mfaBackupCodes!: string[];

  @Prop({ type: Date })
  mfaEnabledAt?: Date;

  @Prop({ type: Date })
  mfaLastUsedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  failedLoginCount!: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ default: false })
  isSystemUser!: boolean;

  @Prop({ trim: true, default: 'vi-VN' })
  locale!: string;

  @Prop({ trim: true, default: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.LOCAL,
  })
  authProvider!: AuthProvider;

  @Prop({ type: [Object], default: [] })
  oauthAccounts!: Array<Record<string, unknown>>;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop({ type: String })
  tenantStatus?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, status: 1 });
UserSchema.index({ tenantId: 1, isDeleted: 1 });
UserSchema.index({ tenantId: 1, departmentId: 1 });
UserSchema.index({ tenantId: 1, managerId: 1 });
UserSchema.index({ tenantId: 1, employeeCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ tenantId: 1, 'oauthAccounts.providerId': 1 });
UserSchema.index({ tenantId: 1, 'oauthAccounts.provider': 1 });
