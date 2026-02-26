import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ZoneType } from '@shared/schemas/zone.schema';

export class CreateZoneDto {
  @ApiProperty({ example: 'Z-001', description: 'Zone code (unique per warehouse)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Zone A', description: 'Zone name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    enum: ZoneType,
    example: ZoneType.STORAGE,
    description: 'Zone type',
  })
  @IsOptional()
  @IsEnum(ZoneType)
  type?: ZoneType;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequence?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether this is the default zone' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the zone is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Main storage zone', description: 'Zone description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateZoneDto extends PartialType(CreateZoneDto) {}

export class QueryZoneDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, description: 'Page size' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: ZoneType, description: 'Filter by zone type' })
  @IsOptional()
  @IsEnum(ZoneType)
  type?: ZoneType;

  @ApiPropertyOptional({ description: 'Search by code or name' })
  @IsOptional()
  @IsString()
  search?: string;
}
