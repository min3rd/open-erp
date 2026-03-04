import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ShipmentDocument = HydratedDocument<Shipment>;

export enum ShipmentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIAL = 'partial',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  collection: 'shipments',
  versionKey: false,
})
export class Shipment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Warehouse', required: true, index: true })
  warehouseId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  orderIds: string[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'WmsPackage', default: [] })
  packageIds: MongooseSchema.Types.ObjectId[];

  @Prop({ type: String, enum: ShipmentStatus, default: ShipmentStatus.DRAFT, index: true })
  status: ShipmentStatus;

  @Prop({ type: String })
  carrier?: string;

  @Prop({ type: String })
  trackingNumber?: string;

  @Prop({ type: String })
  carrierMetadata?: string;

  @Prop({ type: String })
  recipientName?: string;

  @Prop({ type: String })
  recipientAddress?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  shippedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  shippedAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

ShipmentSchema.index({ orgId: 1, status: 1 });
ShipmentSchema.index({ warehouseId: 1, status: 1 });
ShipmentSchema.index({ createdAt: -1 });

ShipmentSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

ShipmentSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
