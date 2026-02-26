import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BinDocument = HydratedDocument<Bin>;

export enum BinType {
  STANDARD = 'standard',
  PALLET = 'pallet',
  BULK = 'bulk',
  SHELF = 'shelf',
  FLOOR = 'floor',
  RACK = 'rack',
  DRAWER = 'drawer',
}

@Schema({ _id: false })
export class BinDimensions {
  @Prop({ type: Number, min: 0 })
  lengthCm?: number;

  @Prop({ type: Number, min: 0 })
  widthCm?: number;

  @Prop({ type: Number, min: 0 })
  heightCm?: number;
}

@Schema({
  timestamps: true,
  collection: 'bins',
  versionKey: false,
})
export class Bin extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Aisle',
    required: true,
    index: true,
  })
  aisleId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    index: true,
  })
  code: string;

  @Prop({
    type: String,
    trim: true,
    index: true,
  })
  barcode?: string;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  capacityQty: number;

  @Prop({
    type: Number,
    min: 0,
  })
  capacityVolume?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  currentQty: number;

  @Prop({
    type: [String],
    default: [],
  })
  allowedSkuTags?: string[];

  @Prop({
    type: BinDimensions,
  })
  dimensions?: BinDimensions;

  @Prop({
    type: String,
    enum: Object.values(BinType),
    default: BinType.STANDARD,
  })
  binType: BinType;

  @Prop({
    type: Boolean,
    default: false,
  })
  isBlocked: boolean;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Map,
    of: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const BinSchema = SchemaFactory.createForClass(Bin);

// Compound unique index: code scoped to aisleId
BinSchema.index({ aisleId: 1, code: 1 }, { unique: true });
BinSchema.index({ barcode: 1 }, { sparse: true });

// Exclude soft-deleted by default
BinSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

BinSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

BinSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
