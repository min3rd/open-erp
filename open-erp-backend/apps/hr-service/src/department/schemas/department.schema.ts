import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  code: string;

  @Prop()
  parentDepartmentId: string;

  @Prop()
  managerId: string;

  @Prop({ default: 'active' })
  status: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
