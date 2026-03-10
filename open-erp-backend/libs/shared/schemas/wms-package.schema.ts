import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type WmsPackageDocument = HydratedDocument<WmsPackage>;

export enum WmsPackageStatus {
  OPEN = 'open',
  PACKED = 'packed',
  SHIPPED = 'shipped',
}

@Schema({
  timestamps: true,
  collection: 'wms_packages',
  versionKey: false,
})
export class WmsPackage extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Shipment', index: true })
  shipmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  picklistIds: string[];

  @Prop({
    type: String,
    enum: WmsPackageStatus,
    default: WmsPackageStatus.OPEN,
    index: true,
  })
  status: WmsPackageStatus;

  @Prop({ type: Number })
  weight?: number;

  @Prop({ type: String })
  dimensions?: string;

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: String })
  trackingNumber?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const WmsPackageSchema = SchemaFactory.createForClass(WmsPackage);

WmsPackageSchema.index({ orgId: 1, status: 1 });
WmsPackageSchema.index({ createdAt: -1 });

WmsPackageSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

WmsPackageSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
