import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalActionType } from '@shared/schemas/approval-request.schema';

export class CreateApprovalRequestDto {
  @ApiProperty({
    description: 'Entity type (e.g., "document", "activity")',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'Entity ID being approved' })
  @IsMongoId()
  entityId: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsMongoId()
  orgId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for condition evaluation',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApprovalAttachmentDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MinIO object key' })
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @ApiProperty({ description: 'MinIO bucket name' })
  @IsString()
  @IsNotEmpty()
  fileBucket: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

export class SubmitApprovalActionDto {
  @ApiProperty({
    enum: ApprovalActionType,
    description: 'Action: APPROVE, REJECT, REQUEST_CHANGES, or SHARE',
  })
  @IsEnum(ApprovalActionType)
  action: ApprovalActionType;

  @ApiPropertyOptional({ description: 'Comment for the action' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    type: [ApprovalAttachmentDto],
    description: 'File attachments',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalAttachmentDto)
  attachments?: ApprovalAttachmentDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'User IDs to share with (for SHARE action)',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  shareWithUserIds?: string[];
}
