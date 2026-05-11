import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true, collection: 'departments' })
export class Department {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  code?: string;

  @Prop({ type: Types.ObjectId, index: true })
  parentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  managerId?: Types.ObjectId;

  @Prop({ default: 0 })
  level!: number;

  @Prop({ trim: true, default: '/' })
  path!: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ default: 0 })
  headcount!: number;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ tenantId: 1, parentId: 1 });
DepartmentSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, sparse: true },
);
DepartmentSchema.index({ tenantId: 1, path: 1 });
