import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDate,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QcStatus, ReceiptType } from '@shared/schemas';

export class CreateReceiptLineDto {
  @ApiProperty({ description: 'Product/SKU ID' })
  @IsMongoId()
  skuId: string;

  @ApiPropertyOptional({ description: 'SKU code' })
  @IsOptional()
  @IsString()
  skuCode?: string;

  @ApiPropertyOptional({ description: 'SKU name' })
  @IsOptional()
  @IsString()
  skuName?: string;

  @ApiProperty({ description: 'Ordered quantity' })
  @IsNumber()
  @Min(0)
  orderedQty: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class ReferenceDocDto {
  @ApiProperty({ description: 'Reference document type (invoice, po, transfer_note)' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Reference document ID' })
  @IsOptional()
  @IsString()
  refId?: string;

  @ApiPropertyOptional({ description: 'External URL (for linked documents)' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'MinIO object key (for uploaded files)' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ description: 'MinIO bucket name' })
  @IsOptional()
  @IsString()
  fileBucket?: string;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;
}

export class RequestUploadUrlDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Reference document type' })
  @IsOptional()
  @IsString()
  docType?: string;
}

export class CreateReceiptDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsMongoId()
  orgId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsMongoId()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Receipt type', enum: ReceiptType })
  @IsOptional()
  @IsEnum(ReceiptType)
  type?: ReceiptType;

  @ApiPropertyOptional({ description: 'Purchase Order ID' })
  @IsOptional()
  @IsString()
  poId?: string;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Shipping party name' })
  @IsOptional()
  @IsString()
  shippingParty?: string;

  @ApiPropertyOptional({ description: 'Expected receipt date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedReceiptAt?: Date;

  @ApiPropertyOptional({ description: 'Reference documents', type: [ReferenceDocDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDocDto)
  referenceDocs?: ReferenceDocDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Receipt lines', type: [CreateReceiptLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptLineDto)
  lines?: CreateReceiptLineDto[];
}

export class UpdateReceiptDto {
  @ApiPropertyOptional({ description: 'Receipt type', enum: ReceiptType })
  @IsOptional()
  @IsEnum(ReceiptType)
  type?: ReceiptType;

  @ApiPropertyOptional({ description: 'Purchase Order ID' })
  @IsOptional()
  @IsString()
  poId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Shipping party name' })
  @IsOptional()
  @IsString()
  shippingParty?: string;

  @ApiPropertyOptional({ description: 'Expected receipt date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedReceiptAt?: Date;

  @ApiPropertyOptional({ description: 'Reference documents', type: [ReferenceDocDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDocDto)
  referenceDocs?: ReferenceDocDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Receipt lines', type: [CreateReceiptLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptLineDto)
  lines?: CreateReceiptLineDto[];
}

export class SubmitReceiptDto {
  @ApiPropertyOptional({ description: 'Reviewer user IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  reviewers?: string[];

  @ApiPropertyOptional({ description: 'Notes for reviewers' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewReceiptDto {
  @ApiProperty({ description: 'Review action', enum: ['accept', 'reject'] })
  @IsEnum(['accept', 'reject'])
  action: 'accept' | 'reject';

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'QC notes per line', type: [Object] })
  @IsOptional()
  @IsArray()
  lineQcResults?: { lineIndex: number; qcStatus: QcStatus; qcNotes?: string; defectQty?: number }[];
}

export class ApproveReceiptDto {
  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveLineDto {
  @ApiPropertyOptional({ description: 'Line ID' })
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiProperty({ description: 'SKU ID of the line to receive' })
  @IsString()
  skuId: string;

  @ApiProperty({ description: 'Received quantity' })
  @IsNumber()
  @Min(0)
  receivedQty: number;

  @ApiPropertyOptional({ description: 'Lot ID' })
  @IsOptional()
  @IsMongoId()
  lotId?: string;

  @ApiPropertyOptional({ description: 'Serial numbers', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serials?: string[];
}

export class ReceiveReceiptDto {
  @ApiProperty({ description: 'Receipt lines to receive', type: [ReceiveLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveLineDto)
  lines: ReceiveLineDto[];

  @ApiPropertyOptional({ description: 'Actual receipt date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualReceiptAt?: Date;

  @ApiPropertyOptional({ description: 'Whether this is a partial receive' })
  @IsOptional()
  @IsBoolean()
  partial?: boolean;
}

export class FinalizeReceiptDto {
  @ApiPropertyOptional({ description: 'Notes for finalization' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UnlockReceiptDto {
  @ApiProperty({ description: 'Reason for unlocking (required for audit)' })
  @IsString()
  reason: string;
}

export class QcReceiptDto {
  @ApiProperty({ description: 'QC status', enum: QcStatus })
  @IsEnum(QcStatus)
  qcStatus: QcStatus;

  @ApiPropertyOptional({ description: 'QC notes' })
  @IsOptional()
  @IsString()
  qcNotes?: string;

  @ApiPropertyOptional({ description: 'Number of defective items' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defectQty?: number;

  @ApiPropertyOptional({ description: 'Quarantine bin location' })
  @IsOptional()
  @IsString()
  quarantineBin?: string;

  @ApiPropertyOptional({ description: 'Line index to apply QC to' })
  @IsOptional()
  @IsNumber()
  lineIndex?: number;
}
