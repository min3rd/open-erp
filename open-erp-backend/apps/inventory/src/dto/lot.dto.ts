import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateLotDto {
  @ApiProperty({ description: 'Product/SKU ID' })
  @IsMongoId()
  skuId: string;

  @ApiProperty({ description: 'Lot code' })
  @IsString()
  lotCode: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @IsOptional()
  @IsDateString()
  manufacturedAt?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryAt?: string;

  @ApiPropertyOptional({ description: 'Total quantity', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQty?: number;

  @ApiPropertyOptional({ description: 'Remaining quantity', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingQty?: number;
}

export class UpdateLotDto {
  @ApiPropertyOptional({ description: 'Lot code' })
  @IsOptional()
  @IsString()
  lotCode?: string;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @IsOptional()
  @IsDateString()
  manufacturedAt?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryAt?: string;

  @ApiPropertyOptional({ description: 'Total quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQty?: number;

  @ApiPropertyOptional({ description: 'Remaining quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingQty?: number;
}
