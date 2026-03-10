import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsMongoId()
  orgId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsMongoId()
  warehouseId: string;

  @ApiPropertyOptional({
    description: 'Order IDs linked to this shipment',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderIds?: string[];

  @ApiPropertyOptional({
    description: 'Package IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  packageIds?: string[];

  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Recipient address' })
  @IsOptional()
  @IsString()
  recipientAddress?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ShipShipmentDto {
  @ApiPropertyOptional({ description: 'Whether this is a partial shipment' })
  @IsOptional()
  @IsBoolean()
  partial?: boolean;

  @ApiPropertyOptional({
    description: 'Package IDs being shipped in this batch',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  packageIds?: string[];

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;
}
