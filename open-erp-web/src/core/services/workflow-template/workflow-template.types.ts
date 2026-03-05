/**
 * Approval scope enum
 */
export enum ApprovalScope {
  GLOBAL = 'GLOBAL',
  ORG = 'ORG',
  DEPARTMENT = 'DEPARTMENT',
}

/**
 * Approval mode enum
 */
export enum ApprovalMode {
  ANY = 'ANY',
  ALL = 'ALL',
  QUORUM = 'QUORUM',
}

/**
 * Template status enum
 */
export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Workflow node types
 */
export enum WorkflowNodeType {
  START = 'start',
  APPROVAL = 'approval',
  CONDITION = 'condition',
  END = 'end',
}

/**
 * Node position on canvas
 */
export interface NodePoint {
  x: number;
  y: number;
}

/**
 * Edge condition for conditional branching
 */
export interface EdgeCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: any;
}

/**
 * Workflow node data
 */
export interface WorkflowNodeData {
  label?: string;
  description?: string;
  approverIds?: string[];
  approvalMode?: ApprovalMode;
  quorumCount?: number;
  timeoutHours?: number;
}

/**
 * Workflow node definition
 */
export interface WorkflowNode {
  id: string;
  point: NodePoint;
  type: WorkflowNodeType;
  data?: WorkflowNodeData;
}

/**
 * Workflow edge data
 */
export interface WorkflowEdgeData {
  label?: string;
  conditions?: EdgeCondition[];
}

/**
 * Workflow edge definition
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  data?: WorkflowEdgeData;
}

/**
 * Workflow template interface matching backend schema
 */
export interface WorkflowTemplate {
  _id: string;
  name: string;
  description?: string;
  entityType: string;
  scope: ApprovalScope;
  orgId?: string;
  departmentId?: string;
  status: TemplateStatus;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

/**
 * DTO for creating a workflow template
 */
export interface CreateWorkflowTemplateDto {
  name: string;
  description?: string;
  entityType: string;
  scope: ApprovalScope;
  orgId?: string;
  departmentId?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * DTO for updating a workflow template
 */
export type UpdateWorkflowTemplateDto = Partial<CreateWorkflowTemplateDto>;

/**
 * DTO for cloning a workflow template
 */
export interface CloneWorkflowTemplateDto {
  name: string;
  description?: string;
  scope?: ApprovalScope;
  orgId?: string;
  departmentId?: string;
}

/**
 * Query params for listing workflow templates
 */
export interface QueryWorkflowTemplateParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: TemplateStatus;
  scope?: ApprovalScope;
  entityType?: string;
  orgId?: string;
  departmentId?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Validation result from backend
 */
export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Workflow template list response from resolver
 */
export interface WorkflowTemplateListResponse {
  items: WorkflowTemplate[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
