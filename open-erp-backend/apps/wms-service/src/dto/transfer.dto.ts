import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferLineDto {
  @ApiProperty({ description: 'SKU code' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Quantity to transfer' })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsOptional()
  @IsString()
  lotNumber?: string;
}

export class CreateTransferDto {
  @ApiProperty({ description: 'Source warehouse ID' })
  @IsMongoId()
  fromWarehouseId: string;

  @ApiProperty({ description: 'Destination warehouse ID' })
  @IsMongoId()
  toWarehouseId: string;

  @ApiProperty({ description: 'Transfer lines', type: [TransferLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];

  @ApiPropertyOptional({ description: 'Reference note' })
  @IsOptional()
  @IsString()
  referenceNote?: string;
}

export class TransferQueryDto {
  @ApiPropertyOptional({ description: 'Warehouse ID filter (source or destination)' })
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsOptional()
  @IsString()
  status?: string;

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
