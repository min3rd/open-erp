import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePicklistLineDto {
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

  @ApiProperty({ description: 'Quantity to pick' })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreatePicklistDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsMongoId()
  orgId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsMongoId()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Order IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderIds?: string[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Assigned picker user ID' })
  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Picklist lines',
    type: [CreatePicklistLineDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePicklistLineDto)
  lines?: CreatePicklistLineDto[];
}

export class PickLineDto {
  @ApiProperty({ description: 'SKU ID' })
  @IsMongoId()
  skuId: string;

  @ApiProperty({ description: 'Picked quantity' })
  @IsNumber()
  @Min(0)
  pickedQty: number;

  @ApiPropertyOptional({
    description: 'Bin locations picked from',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bins?: string[];

  @ApiPropertyOptional({ description: 'Serial numbers picked', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serials?: string[];

  @ApiPropertyOptional({ description: 'Lot ID' })
  @IsOptional()
  @IsMongoId()
  lotId?: string;
}

export class PickDto {
  @ApiProperty({ description: 'Pick lines', type: [PickLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickLineDto)
  picks: PickLineDto[];
}

export class CreatePackageDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsMongoId()
  orgId: string;

  @ApiPropertyOptional({ description: 'Shipment ID' })
  @IsOptional()
  @IsMongoId()
  shipmentId?: string;

  @ApiPropertyOptional({
    description: 'Picklist IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  picklistIds?: string[];

  @ApiPropertyOptional({ description: 'Package weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Package dimensions (LxWxH cm)' })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
