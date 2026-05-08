import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  departmentId: string;

  @Prop({ default: 'active' })
  status: string; // active | inactive | on_leave

  @Prop()
  position: string;

  @Prop()
  managerId: string;

  @Prop()
  hireDate: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ tenantId: 1, departmentId: 1 });
