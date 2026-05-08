import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkflowRequestDocument = HydratedDocument<WorkflowRequest>;

@Schema({ timestamps: true })
export class WorkflowRequest {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  entityType: string; // e.g., 'purchase_order', 'leave_request'

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  requestedBy: string;

  @Prop({ default: 'pending' })
  status: string; // pending | approved | rejected | cancelled

  @Prop()
  approvedBy: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  approvedAt: Date;
}

export const WorkflowRequestSchema = SchemaFactory.createForClass(WorkflowRequest);

WorkflowRequestSchema.index({ tenantId: 1, status: 1 });
WorkflowRequestSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
