import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { SerialStatus } from '@shared/schemas';

export class CreateSerialDto {
  @ApiProperty({ description: 'Product/SKU ID' })
  @IsMongoId()
  skuId: string;

  @ApiProperty({ description: 'Serial number' })
  @IsString()
  serial: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Bin ID' })
  @IsOptional()
  @IsMongoId()
  binId?: string;

  @ApiPropertyOptional({ description: 'Lot ID' })
  @IsOptional()
  @IsMongoId()
  lotId?: string;
}

export class UpdateSerialDto {
  @ApiPropertyOptional({ description: 'Serial status', enum: SerialStatus })
  @IsOptional()
  @IsEnum(SerialStatus)
  status?: SerialStatus;

  @ApiPropertyOptional({ description: 'Bin ID' })
  @IsOptional()
  @IsMongoId()
  binId?: string;

  @ApiPropertyOptional({ description: 'Lot ID' })
  @IsOptional()
  @IsMongoId()
  lotId?: string;
}

export class QuerySerialDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  skuId?: string;

  @ApiPropertyOptional({ enum: SerialStatus })
  @IsOptional()
  @IsEnum(SerialStatus)
  status?: SerialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  binId?: string;
}
