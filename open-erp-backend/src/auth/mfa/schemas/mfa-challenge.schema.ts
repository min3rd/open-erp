import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MfaChallengeDocument = HydratedDocument<MfaChallenge>;

@Schema({ timestamps: true, collection: 'mfa_challenges' })
export class MfaChallenge {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  used!: boolean;

  @Prop({ default: 0 })
  failedAttempts!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MfaChallengeSchema = SchemaFactory.createForClass(MfaChallenge);

MfaChallengeSchema.index({ token: 1 }, { unique: true });
MfaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
