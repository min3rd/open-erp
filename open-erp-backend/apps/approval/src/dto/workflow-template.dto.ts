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
} from '@shared/schemas/approval-workflow-template.schema';

export class WorkflowStepConditionDto {
  @ApiProperty({ description: 'Field name to evaluate' })
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

export class WorkflowBranchDto {
  @ApiProperty({ type: [WorkflowStepConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepConditionDto)
  conditions: WorkflowStepConditionDto[];

  @ApiProperty({ description: 'Order number of the next step to jump to' })
  @IsNumber()
  @Min(0)
  nextStepOrder: number;
}

export class WorkflowStepDto {
  @ApiProperty({ description: 'Step order number (0-based)' })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiProperty({ description: 'Step name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Step description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [String],
    description: 'User IDs of approvers for this step',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  approverIds: string[];

  @ApiProperty({
    enum: ApprovalMode,
    description: 'Approval mode: ANY (one approver), ALL (all approvers), QUORUM (minimum count)',
  })
  @IsEnum(ApprovalMode)
  approvalMode: ApprovalMode;

  @ApiPropertyOptional({
    description: 'Minimum approvals needed when mode is QUORUM',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quorumCount?: number;

  @ApiPropertyOptional({
    type: [WorkflowBranchDto],
    description: 'Conditional branches from this step',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowBranchDto)
  branches?: WorkflowBranchDto[];

  @ApiPropertyOptional({ description: 'Timeout in hours for this step' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeoutHours?: number;
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

  @ApiProperty({ type: [WorkflowStepDto], description: 'Workflow steps' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
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
    type: [WorkflowStepDto],
    description: 'Updated workflow steps',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps?: WorkflowStepDto[];
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
