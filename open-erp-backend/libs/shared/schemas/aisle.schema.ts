import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { LayoutPosition, LayoutPositionSchema } from './layout.schema';

export type AisleDocument = HydratedDocument<Aisle>;

@Schema({
  timestamps: true,
  collection: 'aisles',
  versionKey: false,
})
export class Aisle extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Zone',
    required: true,
    index: true,
  })
  zoneId: MongooseSchema.Types.ObjectId;

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
    type: Number,
    default: 0,
    min: 0,
  })
  sequence: number;

  @Prop({
    type: Number,
    default: 1,
    min: 1,
  })
  levels: number;

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

export const AisleSchema = SchemaFactory.createForClass(Aisle);

// Compound unique index: code scoped to zoneId
AisleSchema.index({ zoneId: 1, code: 1 }, { unique: true });
AisleSchema.index({ zoneId: 1, sequence: 1 });

// Exclude soft-deleted by default
AisleSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

AisleSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

AisleSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
