import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApprovalMode } from './approval-workflow-template.schema';

export type ApprovalRequestDocument = ApprovalRequest & Document;

export enum ApprovalRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalActionType {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  SHARE = 'SHARE',
}

export class StepApproval {
  userId: Types.ObjectId;
  action: ApprovalActionType;
  comment?: string;
  attachments?: ApprovalAttachment[];
  actionAt: Date;
}

export class ApprovalAttachment {
  fileName: string;
  fileKey: string;
  fileBucket: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  publicUrl?: string;
}

export class RequestStep {
  order: number;
  name: string;
  approverIds: Types.ObjectId[];
  approvalMode: ApprovalMode;
  quorumCount?: number;
  status: ApprovalRequestStatus;
  approvals: StepApproval[];
  startedAt?: Date;
  completedAt?: Date;
}

@Schema({
  collection: 'approval_requests',
  timestamps: true,
  versionKey: false,
})
export class ApprovalRequest {
  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true, type: Types.ObjectId })
  entityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  orgId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  departmentId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: ApprovalRequestStatus,
    default: ApprovalRequestStatus.PENDING,
  })
  status: ApprovalRequestStatus;

  @Prop({ default: 0 })
  currentStepOrder: number;

  @Prop({ type: [Object], default: [] })
  steps: RequestStep[];

  @Prop({ type: [Object], default: [] })
  auditLog: AuditLogEntry[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, required: true })
  requestedBy: Types.ObjectId;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export class AuditLogEntry {
  action: string;
  userId: Types.ObjectId;
  stepOrder?: number;
  comment?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export const ApprovalRequestSchema =
  SchemaFactory.createForClass(ApprovalRequest);

ApprovalRequestSchema.index({ entityType: 1, entityId: 1 });
ApprovalRequestSchema.index({ templateId: 1 });
ApprovalRequestSchema.index({ orgId: 1, status: 1 });
ApprovalRequestSchema.index({ requestedBy: 1 });
ApprovalRequestSchema.index({
  'steps.approverIds': 1,
  status: 1,
});
