import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CatalogType, CatalogItemStatus } from '../schemas/catalog-item.schema';

export class CreateCatalogItemDto {
  @ApiProperty({ enum: CatalogType, example: CatalogType.CATEGORY })
  @IsEnum(CatalogType)
  catalogType: string;

  @ApiProperty({ example: 'CAT-001', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Danh mục sản phẩm A', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'org-uuid-123' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({ example: 'parent-id-uuid' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: { unit: 'kg', symbol: 'kg' } })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: CatalogItemStatus, default: CatalogItemStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: string;
}

export class UpdateCatalogItemDto {
  @ApiPropertyOptional({ enum: CatalogType })
  @IsOptional()
  @IsEnum(CatalogType)
  catalogType?: string;

  @ApiPropertyOptional({ example: 'CAT-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ example: 'Tên mới' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: CatalogItemStatus })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: string;

  @ApiProperty({ example: 'user-uuid-456' })
  @IsString()
  updatedBy: string;
}

export class PublishCatalogItemDto {
  @ApiProperty({ enum: CatalogType, example: CatalogType.CATEGORY })
  @IsEnum(CatalogType)
  catalogType: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách code cần publish. Nếu rỗng thì publish tất cả active.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codes?: string[];
}

export class QueryCatalogItemDto {
  @ApiPropertyOptional({ enum: CatalogType })
  @IsOptional()
  @IsEnum(CatalogType)
  catalogType?: string;

  @ApiPropertyOptional({ enum: CatalogItemStatus })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: string;

  @ApiPropertyOptional({ example: 'parent-id-uuid' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number = 20;
}
