import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat, ExportMode } from '@shared/schemas';

export enum ExportScope {
  GLOBAL = 'global',
  ORG = 'org',
}

export class CreateExportJobDto {
  @ApiProperty({
    description: 'Entity type to export (e.g. users, products, warehouses)',
  })
  @IsString()
  entity: string;

  @ApiPropertyOptional({ description: 'Filters to apply' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.XLSX })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({ enum: ExportMode, default: ExportMode.FLAT })
  @IsOptional()
  @IsEnum(ExportMode)
  exportMode?: ExportMode;

  @ApiPropertyOptional({ description: 'Organization ID for scoping' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({
    enum: ExportScope,
    default: ExportScope.GLOBAL,
    description: 'Export scope: global (all data) or org (organization-scoped)',
  })
  @IsOptional()
  @IsEnum(ExportScope)
  scope?: ExportScope;
}
