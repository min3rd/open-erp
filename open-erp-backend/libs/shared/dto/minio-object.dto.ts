import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * Shared DTO for a MinIO-stored file object.
 * Reuse this in any DTO that needs to reference a MinIO upload.
 */
export class MinioObjectDto {
  @ApiProperty({ description: 'MinIO object key (storage path)' })
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @ApiPropertyOptional({ description: 'MinIO bucket name' })
  @IsOptional()
  @IsString()
  fileBucket?: string;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Public URL (if the object is publicly accessible)' })
  @IsOptional()
  @IsString()
  publicUrl?: string;
}
