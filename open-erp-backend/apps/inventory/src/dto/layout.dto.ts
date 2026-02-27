import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LayoutObjectType } from '@shared/schemas/layout.schema';

// ─── WarehouseLayout DTOs ─────────────────────────────────────────────────────

export class CreateLayoutDto {
  @ApiProperty({ example: 50, description: 'Physical width of the warehouse floor in meters' })
  @IsNumber()
  @Min(0.1)
  widthM: number;

  @ApiProperty({ example: 30, description: 'Physical length of the warehouse floor in meters' })
  @IsNumber()
  @Min(0.1)
  lengthM: number;

  @ApiPropertyOptional({ example: 50, description: 'Display scale: pixels per meter' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  scale?: number;
}

export class UpdateLayoutDto extends PartialType(CreateLayoutDto) {}

// ─── LayoutObject DTOs ────────────────────────────────────────────────────────

export class CreateLayoutObjectDto {
  @ApiPropertyOptional({ example: '60f7e...', description: 'Parent layout object ID (null for zones)' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ enum: LayoutObjectType, example: LayoutObjectType.ZONE, description: 'Object type' })
  @IsEnum(LayoutObjectType)
  type: LayoutObjectType;

  @ApiProperty({ example: 'Z-001', description: 'Unique code per warehouse' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Zone A', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 0, description: 'X position in meters from origin' })
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional({ example: 0, description: 'Y position in meters from origin' })
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiProperty({ example: 10, description: 'Width in meters' })
  @IsNumber()
  @Min(0.1)
  widthM: number;

  @ApiProperty({ example: 8, description: 'Height/depth in meters' })
  @IsNumber()
  @Min(0.1)
  heightM: number;

  @ApiPropertyOptional({ example: 0, description: 'Rotation in degrees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(359)
  rotationDeg?: number;

  @ApiPropertyOptional({ example: '1234567890', description: 'Barcode (auto-generated if absent)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the location is blocked' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ example: 100, description: 'Maximum capacity in quantity units' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityQty?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Maximum capacity in cubic meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityVolume?: number;

  @ApiPropertyOptional({ type: [String], description: 'Allowed SKU tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedSkuTags?: string[];
}

export class UpdateLayoutObjectDto extends PartialType(CreateLayoutObjectDto) {}

export class BatchUpdateLayoutObjectsDto {
  @ApiProperty({
    type: [UpdateLayoutObjectDto],
    description: 'Array of layout object patches (each must include id)',
  })
  @IsArray()
  items: Array<UpdateLayoutObjectDto & { id: string }>;
}

export class QueryLayoutObjectDto {
  @ApiPropertyOptional({ enum: LayoutObjectType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(LayoutObjectType)
  type?: LayoutObjectType;

  @ApiPropertyOptional({ description: 'Filter by parentId' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 200;
}
