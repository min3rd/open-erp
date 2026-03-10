import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovalWorkflowTemplateDocument = ApprovalWorkflowTemplate &
  Document;

export enum ApprovalScope {
  GLOBAL = 'GLOBAL',
  ORG = 'ORG',
  DEPARTMENT = 'DEPARTMENT',
}

export enum ApprovalMode {
  ANY = 'ANY',
  ALL = 'ALL',
  QUORUM = 'QUORUM',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkflowNodeType {
  START = 'start',
  APPROVAL = 'approval',
  CONDITION = 'condition',
  END = 'end',
}

export class NodePoint {
  x: number;
  y: number;
}

export class EdgeCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: any;
}

export class WorkflowNode {
  id: string;
  point: NodePoint;
  type: WorkflowNodeType;
  data?: {
    label?: string;
    description?: string;
    approverIds?: Types.ObjectId[];
    approvalMode?: ApprovalMode;
    quorumCount?: number;
    timeoutHours?: number;
  };
}

export class WorkflowEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    label?: string;
    conditions?: EdgeCondition[];
  };
}

@Schema({
  collection: 'approval_workflow_templates',
  timestamps: true,
  versionKey: false,
})
export class ApprovalWorkflowTemplate {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true, enum: ApprovalScope, default: ApprovalScope.GLOBAL })
  scope: ApprovalScope;

  @Prop({ type: Types.ObjectId })
  orgId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  departmentId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: [Object], default: [] })
  nodes: WorkflowNode[];

  @Prop({ type: [Object], default: [] })
  edges: WorkflowEdge[];

  @Prop({ type: Types.ObjectId, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ApprovalWorkflowTemplateSchema = SchemaFactory.createForClass(
  ApprovalWorkflowTemplate,
);

ApprovalWorkflowTemplateSchema.index({ entityType: 1, scope: 1, status: 1 });
ApprovalWorkflowTemplateSchema.index({ orgId: 1, entityType: 1 });
ApprovalWorkflowTemplateSchema.index({ departmentId: 1, entityType: 1 });
