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

export class NodeApproval {
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

export class RequestNodeState {
  nodeId: string;
  label: string;
  approverIds: Types.ObjectId[];
  approvalMode: ApprovalMode;
  quorumCount?: number;
  status: ApprovalRequestStatus;
  approvals: NodeApproval[];
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

  @Prop({ required: true })
  currentNodeId: string;

  @Prop({ type: [Object], default: [] })
  nodeStates: RequestNodeState[];

  @Prop({ type: [Object], default: [] })
  nodes: Array<{
    id: string;
    type: string;
    point: { x: number; y: number };
  }>;

  @Prop({ type: [Object], default: [] })
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: { label?: string; conditions?: Array<{ field: string; operator: string; value: any }> };
  }>;

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
  nodeId?: string;
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
  'nodeStates.approverIds': 1,
  status: 1,
});

