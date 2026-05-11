import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TenantUsageHistoryDocument = HydratedDocument<TenantUsageHistory>;

@Schema({ timestamps: true, collection: 'tenant_usage_history' })
export class TenantUsageHistory {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ default: 0 })
  apiCalls!: number;

  @Prop({ default: 0 })
  activeUsers!: number;

  @Prop({ default: 0 })
  storageBytes!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TenantUsageHistorySchema = SchemaFactory.createForClass(TenantUsageHistory);

TenantUsageHistorySchema.index({ tenantId: 1, date: -1 });
TenantUsageHistorySchema.index({ date: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });