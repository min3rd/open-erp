import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QcStatus } from '@shared/schemas';

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

export class CreateReceiptDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsMongoId()
  orgId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsMongoId()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Purchase Order ID' })
  @IsOptional()
  @IsString()
  poId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplier?: string;

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

export class ReceiveLineDto {
  @ApiProperty({ description: 'Line index or SKU ID' })
  @IsString()
  lineId: string;

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

  @ApiPropertyOptional({ description: 'Whether this is a partial receive' })
  @IsOptional()
  @IsBoolean()
  partial?: boolean;
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
