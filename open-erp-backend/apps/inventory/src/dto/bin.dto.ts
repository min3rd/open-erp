import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BinType } from '@shared/schemas/bin.schema';

export class BinDimensionsDto {
  @ApiPropertyOptional({ example: 100, description: 'Length in centimeters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number;

  @ApiPropertyOptional({ example: 60, description: 'Width in centimeters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @ApiPropertyOptional({ example: 40, description: 'Height in centimeters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;
}

export class CreateBinDto {
  @ApiProperty({ example: 'B-001', description: 'Bin code (unique per aisle)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Barcode (auto-generated if absent)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 100, description: 'Maximum quantity capacity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityQty?: number;

  @ApiPropertyOptional({ example: 0.5, description: 'Maximum volume capacity (m³)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityVolume?: number;

  @ApiPropertyOptional({ example: ['electronics', 'fragile'], description: 'Allowed SKU tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedSkuTags?: string[];

  @ApiPropertyOptional({ type: BinDimensionsDto, description: 'Physical dimensions' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BinDimensionsDto)
  dimensions?: BinDimensionsDto;

  @ApiPropertyOptional({
    enum: BinType,
    example: BinType.STANDARD,
    description: 'Bin type',
  })
  @IsOptional()
  @IsEnum(BinType)
  binType?: BinType;

  @ApiPropertyOptional({ example: false, description: 'Whether the bin is blocked for putaway' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the bin is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBinDto extends PartialType(CreateBinDto) {}

export class QueryBinDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 100, description: 'Page size' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 100;

  @ApiPropertyOptional({ enum: BinType, description: 'Filter by bin type' })
  @IsOptional()
  @IsEnum(BinType)
  binType?: BinType;

  @ApiPropertyOptional({ description: 'Search by code or barcode' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter only available bins (not blocked, currentQty < capacityQty)' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  availableOnly?: boolean;
}
