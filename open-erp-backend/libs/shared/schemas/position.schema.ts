import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PositionDocument = HydratedDocument<Position>;

@Schema({
  timestamps: true,
  collection: 'positions',
  versionKey: false,
})
export class Position extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
  })
  code: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    type: Number,
    default: 0,
  })
  level?: number;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

PositionSchema.index({ organizationId: 1, code: 1 }, { unique: true });
PositionSchema.index({ organizationId: 1, name: 1 });
PositionSchema.index({ organizationId: 1, status: 1 });

PositionSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 7776000 });

PositionSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

PositionSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

PositionSchema.set('toObject', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
