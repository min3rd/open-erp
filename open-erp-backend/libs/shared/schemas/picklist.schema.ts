import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PicklistDocument = HydratedDocument<Picklist>;

export enum PicklistStatus {
  DRAFT = 'draft',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class PicklistLine {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  skuId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  skuCode?: string;

  @Prop({ type: String })
  skuName?: string;

  @Prop({ type: Number, required: true, min: 0 })
  qty: number;

  @Prop({ type: Number, default: 0, min: 0 })
  pickedQty: number;

  @Prop({ type: String })
  unit?: string;

  @Prop({ type: [String], default: [] })
  bins: string[];

  @Prop({ type: [String], default: [] })
  serials: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Lot' })
  lotId?: MongooseSchema.Types.ObjectId;
}

export const PicklistLineSchema = SchemaFactory.createForClass(PicklistLine);

@Schema({
  timestamps: true,
  collection: 'picklists',
  versionKey: false,
})
export class Picklist extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Warehouse', required: true, index: true })
  warehouseId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [], index: true })
  orderIds: string[];

  @Prop({ type: String, enum: PicklistStatus, default: PicklistStatus.DRAFT, index: true })
  status: PicklistStatus;

  @Prop({ type: [PicklistLineSchema], default: [] })
  lines: PicklistLine[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedTo?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const PicklistSchema = SchemaFactory.createForClass(Picklist);

PicklistSchema.index({ orgId: 1, status: 1 });
PicklistSchema.index({ warehouseId: 1, status: 1 });
PicklistSchema.index({ createdAt: -1 });

PicklistSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

PicklistSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
