import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAisleDto {
  @ApiProperty({ example: 'A-001', description: 'Aisle code (unique per zone)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Aisle 1', description: 'Aisle name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequence?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of levels/shelves in this aisle' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  levels?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the aisle is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Main aisle', description: 'Aisle description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateAisleDto extends PartialType(CreateAisleDto) {}

export class QueryAisleDto {
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

  @ApiPropertyOptional({ description: 'Search by code or name' })
  @IsOptional()
  @IsString()
  search?: string;
}
