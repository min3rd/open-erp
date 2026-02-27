import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type LotDocument = HydratedDocument<Lot>;

@Schema({
  timestamps: true,
  collection: 'lots',
  versionKey: false,
})
export class Lot extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  skuId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  lotCode: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  manufacturedAt?: Date;

  @Prop({ type: Date, index: true })
  expiryAt?: Date;

  @Prop({ type: Number, min: 0, default: 0 })
  totalQty: number;

  @Prop({ type: Number, min: 0, default: 0 })
  remainingQty: number;

  @Prop({
    type: Map,
    of: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const LotSchema = SchemaFactory.createForClass(Lot);

LotSchema.index({ skuId: 1, lotCode: 1 }, { unique: true });
LotSchema.index({ expiryAt: 1 });
LotSchema.index({ organizationId: 1, skuId: 1 });

LotSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

LotSchema.set('toObject', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
