import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 0 })
  price!: number;

  @Prop({
    type: Object,
    default: {
      maxUsers: null,
      maxStorageBytes: null,
      maxApiCallsPerDay: null,
    },
  })
  quotas!: {
    maxUsers?: number | null;
    maxStorageBytes?: number | null;
    maxApiCallsPerDay?: number | null;
  };

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({ type: [String], default: [] })
  enabledModules!: string[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  displayOrder!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });
