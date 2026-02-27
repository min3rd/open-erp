import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { LayoutPosition, LayoutPositionSchema } from './layout.schema';

export type ZoneDocument = HydratedDocument<Zone>;

export enum ZoneType {
  STORAGE = 'storage',
  STAGING = 'staging',
  RECEIVING = 'receiving',
  SHIPPING = 'shipping',
  QUARANTINE = 'quarantine',
  RETURN = 'return',
  COLD = 'cold',
  HAZMAT = 'hazmat',
}

@Schema({
  timestamps: true,
  collection: 'zones',
  versionKey: false,
})
export class Zone extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  warehouseId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    index: true,
  })
  code: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(ZoneType),
    default: ZoneType.STORAGE,
  })
  type: ZoneType;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  sequence: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault: boolean;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
    trim: true,
    maxlength: 500,
  })
  description?: string;

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

  @Prop({ type: LayoutPositionSchema, default: null })
  layout?: LayoutPosition | null;
}

export const ZoneSchema = SchemaFactory.createForClass(Zone);

// Compound unique index: code scoped to warehouseId
ZoneSchema.index({ warehouseId: 1, code: 1 }, { unique: true });
ZoneSchema.index({ warehouseId: 1, sequence: 1 });

// Exclude soft-deleted by default
ZoneSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

ZoneSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

ZoneSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
