import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsMongoId,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApprovalScope,
  ApprovalMode,
  WorkflowNodeType,
} from '@shared/schemas/approval-workflow-template.schema';

export class NodePointDto {
  @ApiProperty({ description: 'X coordinate for visual position' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate for visual position' })
  @IsNumber()
  y: number;
}

export class EdgeConditionDto {
  @ApiProperty({ description: 'Metadata field name to evaluate' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
    description: 'Comparison operator',
  })
  @IsEnum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'])
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';

  @ApiProperty({ description: 'Value to compare against' })
  @IsNotEmpty()
  value: any;
}

export class WorkflowNodeDataDto {
  @ApiPropertyOptional({ description: 'Display label for the node' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Description of the node' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'User IDs of approvers (for approval nodes)',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  approverIds?: string[];

  @ApiPropertyOptional({
    enum: ApprovalMode,
    description: 'Approval mode: ANY, ALL, or QUORUM (for approval nodes)',
  })
  @IsOptional()
  @IsEnum(ApprovalMode)
  approvalMode?: ApprovalMode;

  @ApiPropertyOptional({
    description: 'Minimum approvals needed when mode is QUORUM',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quorumCount?: number;

  @ApiPropertyOptional({ description: 'Timeout in hours for approval nodes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeoutHours?: number;
}

export class WorkflowNodeDto {
  @ApiProperty({ description: 'Unique node identifier' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ type: NodePointDto, description: 'Visual position {x, y}' })
  @ValidateNested()
  @Type(() => NodePointDto)
  point: NodePointDto;

  @ApiProperty({
    enum: WorkflowNodeType,
    description: 'Node type: start, approval, condition, or end',
  })
  @IsEnum(WorkflowNodeType)
  type: WorkflowNodeType;

  @ApiPropertyOptional({
    type: WorkflowNodeDataDto,
    description: 'Node-specific data',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowNodeDataDto)
  data?: WorkflowNodeDataDto;
}

export class WorkflowEdgeDataDto {
  @ApiPropertyOptional({ description: 'Display label for the edge' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    type: [EdgeConditionDto],
    description: 'Conditions to evaluate for this edge (used on condition node outputs)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeConditionDto)
  conditions?: EdgeConditionDto[];
}

export class WorkflowEdgeDto {
  @ApiProperty({ description: 'Unique edge identifier' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Source node ID' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ description: 'Target node ID' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({
    type: WorkflowEdgeDataDto,
    description: 'Edge-specific data (label, conditions)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowEdgeDataDto)
  data?: WorkflowEdgeDataDto;
}

export class CreateWorkflowTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Entity type this template applies to (e.g., "document", "activity")',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    enum: ApprovalScope,
    description: 'Scope: GLOBAL, ORG, or DEPARTMENT',
  })
  @IsEnum(ApprovalScope)
  scope: ApprovalScope;

  @ApiPropertyOptional({ description: 'Organization ID (required for ORG/DEPARTMENT scope)' })
  @IsOptional()
  @IsMongoId()
  orgId?: string;

  @ApiPropertyOptional({
    description: 'Department ID (required for DEPARTMENT scope)',
  })
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @ApiProperty({ type: [WorkflowNodeDto], description: 'Workflow graph nodes' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowEdgeDto], description: 'Workflow graph edges' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges: WorkflowEdgeDto[];
}

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ApprovalScope,
    description: 'Scope: GLOBAL, ORG, or DEPARTMENT',
  })
  @IsOptional()
  @IsEnum(ApprovalScope)
  scope?: ApprovalScope;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsMongoId()
  orgId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @ApiPropertyOptional({
    type: [WorkflowNodeDto],
    description: 'Updated workflow graph nodes',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes?: WorkflowNodeDto[];

  @ApiPropertyOptional({
    type: [WorkflowEdgeDto],
    description: 'Updated workflow graph edges',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];
}

export class CloneWorkflowTemplateDto {
  @ApiProperty({ description: 'Name for the cloned template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description for the cloned template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ApprovalScope,
    description: 'Scope override for clone',
  })
  @IsOptional()
  @IsEnum(ApprovalScope)
  scope?: ApprovalScope;

  @ApiPropertyOptional({ description: 'Organization ID override' })
  @IsOptional()
  @IsMongoId()
  orgId?: string;

  @ApiPropertyOptional({ description: 'Department ID override' })
  @IsOptional()
  @IsMongoId()
  departmentId?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    description: 'New status for the template',
  })
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  @IsNotEmpty()
  status: string;
}

export class ValidateWorkflowDto {
  @ApiProperty({ type: [WorkflowNodeDto], description: 'Workflow graph nodes to validate' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowEdgeDto], description: 'Workflow graph edges to validate' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges: WorkflowEdgeDto[];
}
