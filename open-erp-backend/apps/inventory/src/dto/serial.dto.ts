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
