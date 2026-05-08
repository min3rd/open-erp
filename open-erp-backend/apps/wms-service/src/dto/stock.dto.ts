import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryTransactionType } from '@shared/constants';

export class StockQueryDto {
  @ApiPropertyOptional({ description: 'Warehouse ID filter' })
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'SKU code filter' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product ID filter' })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ description: 'Search query (sku/name)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export class AdjustStockLineDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsMongoId()
  warehouseId: string;

  @ApiProperty({ description: 'Quantity delta (positive = add, negative = remove)' })
  @IsNumber()
  qtyDelta: number;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsOptional()
  @IsString()
  lotNumber?: string;
}

export class AdjustStockDto {
  @ApiProperty({ description: 'Adjustment type', enum: InventoryTransactionType })
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Stock lines to adjust', type: [AdjustStockLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustStockLineDto)
  lines: AdjustStockLineDto[];
}
