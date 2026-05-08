import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CatalogItemDocument = CatalogItem & Document;

export enum CatalogType {
  UOM = 'uom',
  CATEGORY = 'category',
  PRODUCT_TYPE = 'product_type',
  TAG = 'tag',
  ATTRIBUTE = 'attribute',
}

export enum CatalogItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({
  collection: 'catalog_items',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CatalogItem {
  @Prop({ type: String, required: true, index: true })
  tenant_id: string;

  @Prop({ type: String, default: null })
  org_id: string | null;

  @Prop({ type: String, required: true, enum: Object.values(CatalogType) })
  catalog_type: string;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  parent_id: string | null;

  @Prop({ type: Object, default: null })
  metadata: Record<string, unknown> | null;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(CatalogItemStatus),
    default: CatalogItemStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: Number, required: true, default: 1, min: 1 })
  version: number;

  @Prop({ type: Date, default: null })
  published_at: Date | null;

  @Prop({ type: String, required: true })
  created_by: string;

  @Prop({ type: String, required: true })
  updated_by: string;

  created_at: Date;
  updated_at: Date;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

// Unique compound index: (tenant_id, catalog_type, code)
CatalogItemSchema.index(
  { tenant_id: 1, catalog_type: 1, code: 1 },
  { unique: true },
);

// Performance index for listing
CatalogItemSchema.index({ tenant_id: 1, status: 1, catalog_type: 1 });

// Tree traversal index
CatalogItemSchema.index({ tenant_id: 1, parent_id: 1 });
