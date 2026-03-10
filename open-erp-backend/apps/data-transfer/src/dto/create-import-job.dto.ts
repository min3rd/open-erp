import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportMode } from '@shared/schemas';

export class CreateImportJobDto {
  @ApiProperty({
    description: 'Entity type to import (e.g. users, products, warehouses)',
  })
  @IsString()
  entity: string;

  @ApiPropertyOptional({ enum: ImportMode, default: ImportMode.CREATE_ONLY })
  @IsOptional()
  @IsEnum(ImportMode)
  importMode?: ImportMode;

  @ApiPropertyOptional({
    description: 'Column mapping: fileColumn -> entityField',
  })
  @IsOptional()
  @IsObject()
  mapping?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Organization ID for scoping' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a dry-run (preview only)',
  })
  @IsOptional()
  dryRun?: boolean;
}
