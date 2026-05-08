import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { JobType, ExportFormat, ImportMode } from '@shared/schemas';

export class CreateImportJobDto {
  @ApiProperty({ description: 'Entity type to import (product, inventory_stock)', example: 'product' })
  @IsString()
  entity: string;

  @ApiProperty({ description: 'Import mode', enum: ImportMode })
  @IsEnum(ImportMode)
  mode: ImportMode;

  @ApiPropertyOptional({ description: 'Mapping template ID' })
  @IsOptional()
  @IsMongoId()
  mappingTemplateId?: string;
}

export class CreateExportJobDto {
  @ApiProperty({ description: 'Entity type to export (product, inventory_stock)' })
  @IsString()
  entity: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Warehouse ID for scoped export' })
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;
}
