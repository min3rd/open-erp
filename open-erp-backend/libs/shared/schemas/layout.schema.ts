import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

// ─── WarehouseLayout ──────────────────────────────────────────────────────────

export type WarehouseLayoutDocument = HydratedDocument<WarehouseLayout>;

@Schema({
  timestamps: true,
  collection: 'warehouse_layouts',
  versionKey: false,
})
export class WarehouseLayout extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    unique: true,
    index: true,
  })
  warehouseId: MongooseSchema.Types.ObjectId;

  /** Physical width of the warehouse floor in meters (X axis) */
  @Prop({ type: Number, required: true, min: 0.1 })
  widthM: number;

  /** Physical length of the warehouse floor in meters (Y axis) */
  @Prop({ type: Number, required: true, min: 0.1 })
  lengthM: number;

  /** Unit of measurement – always 'm' (meters) for now */
  @Prop({ type: String, default: 'm' })
  units: string;

  /** Canvas scale: pixels per meter (informational, set by frontend) */
  @Prop({ type: Number, default: 50, min: 1 })
  scale: number;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const WarehouseLayoutSchema = SchemaFactory.createForClass(WarehouseLayout);

WarehouseLayoutSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

WarehouseLayoutSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

WarehouseLayoutSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

// ─── LayoutObject ─────────────────────────────────────────────────────────────

export type LayoutObjectDocument = HydratedDocument<LayoutObject>;

export enum LayoutObjectType {
  ZONE = 'zone',
  AISLE = 'aisle',
  BIN = 'bin',
}

@Schema({
  timestamps: true,
  collection: 'layout_objects',
  versionKey: false,
})
export class LayoutObject extends Document {
  /** The warehouse this object belongs to */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  warehouseId: MongooseSchema.Types.ObjectId;

  /** Optional parent layout object (zone → aisle, aisle → bin) */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'LayoutObject',
    default: null,
    index: true,
  })
  parentId?: MongooseSchema.Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LayoutObjectType),
    index: true,
  })
  type: LayoutObjectType;

  /** Human code – unique per warehouse */
  @Prop({ type: String, required: true, trim: true, index: true })
  code: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  name: string;

  /** X position in meters from canvas origin (top-left) */
  @Prop({ type: Number, required: true, default: 0 })
  x: number;

  /** Y position in meters from canvas origin */
  @Prop({ type: Number, required: true, default: 0 })
  y: number;

  /** Width of the object in meters */
  @Prop({ type: Number, required: true, min: 0.1 })
  widthM: number;

  /** Height (depth) of the object in meters */
  @Prop({ type: Number, required: true, min: 0.1 })
  heightM: number;

  /** Rotation in degrees (0–359) */
  @Prop({ type: Number, default: 0, min: 0, max: 359 })
  rotationDeg: number;

  /** Auto-generated or manually assigned barcode */
  @Prop({ type: String, trim: true, index: true, sparse: true })
  barcode?: string;

  /** Whether this location is blocked for put-away */
  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  /** Maximum quantity that can be stored in this location */
  @Prop({ type: Number, default: 0, min: 0 })
  capacityQty: number;

  /** Maximum volume capacity in cubic meters */
  @Prop({ type: Number, min: 0 })
  capacityVolume?: number;

  /** Allowed SKU tags for filtering */
  @Prop({ type: [String], default: [] })
  allowedSkuTags?: string[];

  @Prop({
    type: Map,
    of: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const LayoutObjectSchema = SchemaFactory.createForClass(LayoutObject);

// Unique code per warehouse
LayoutObjectSchema.index({ warehouseId: 1, code: 1 }, { unique: true });
LayoutObjectSchema.index({ warehouseId: 1, type: 1 });
LayoutObjectSchema.index({ warehouseId: 1, parentId: 1 });

LayoutObjectSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

LayoutObjectSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

LayoutObjectSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
