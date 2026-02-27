import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum SerialStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  IN_TRANSIT = 'in-transit',
  CONSUMED = 'consumed',
}

export type SerialDocument = HydratedDocument<Serial>;

@Schema({
  timestamps: true,
  collection: 'serials',
  versionKey: false,
})
export class Serial extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  skuId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  serial: string;

  @Prop({
    type: String,
    enum: Object.values(SerialStatus),
    default: SerialStatus.AVAILABLE,
    index: true,
  })
  status: SerialStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Bin',
    index: true,
  })
  binId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Lot',
    index: true,
  })
  lotId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  assignedAt?: Date;

  @Prop({
    type: Map,
    of: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const SerialSchema = SchemaFactory.createForClass(Serial);

SerialSchema.index({ skuId: 1, serial: 1 }, { unique: true });
SerialSchema.index({ binId: 1, status: 1 });
SerialSchema.index({ lotId: 1 });
SerialSchema.index({ organizationId: 1, skuId: 1 });

SerialSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

SerialSchema.set('toObject', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
