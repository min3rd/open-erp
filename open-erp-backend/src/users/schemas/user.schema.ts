import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true,
  })
  status!: UserStatus;

  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop()
  mfaSecret?: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  failedLoginCount!: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ default: false })
  isDeleted!: boolean;

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
