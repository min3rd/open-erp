import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  leaveType: string; // annual | sick | unpaid

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  reason: string;

  @Prop({ default: 'pending' })
  status: string; // pending | approved | rejected

  @Prop()
  approvedBy: string;

  @Prop()
  rejectionReason: string;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

LeaveRequestSchema.index({ tenantId: 1, employeeId: 1 });
LeaveRequestSchema.index({ tenantId: 1, status: 1 });
