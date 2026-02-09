import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PresignUploadQueryDto {
  @ApiProperty({ description: 'Object key/path for the file' })
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Presigned URL expiry in seconds',
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(60)
  @Max(604800)
  expiry?: number;
}

export class PresignDownloadQueryDto {
  @ApiProperty({ description: 'Object key/path for the file' })
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Presigned URL expiry in seconds',
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(60)
  @Max(604800)
  expiry?: number;
}

export class UpdateFileMetadataDto {
  @ApiPropertyOptional({ description: 'New filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'File tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CopyFileDto {
  @ApiProperty({ description: 'Destination key/path' })
  @IsString()
  destinationKey: string;
}

export class MoveFileDto {
  @ApiProperty({ description: 'Destination key/path' })
  @IsString()
  destinationKey: string;
}

export class BulkDeleteDto {
  @ApiProperty({ description: 'Array of file IDs to delete', type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional({ description: 'Hard delete (permanent)', default: false })
  @IsOptional()
  @IsBoolean()
  hard?: boolean;
}

export class ListFilesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  size?: number;

  @ApiPropertyOptional({ description: 'Filter by content type' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Filter by uploaded by user' })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class CreateOnlyOfficeSessionDto {
  @ApiPropertyOptional({ description: 'File ID (from file-service DB)' })
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiPropertyOptional({
    description: 'MinIO object key (alternative to fileId for direct MinIO files)',
  })
  @IsOptional()
  @IsString()
  minioKey?: string;

  @ApiPropertyOptional({
    description: 'MinIO bucket name (required when using minioKey, defaults to configured bucket)',
  })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({
    description: 'Original filename (required when using minioKey)',
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({
    description: 'Editor mode',
    enum: ['view', 'edit'],
    default: 'edit',
  })
  @IsOptional()
  @IsEnum(['view', 'edit'])
  mode?: 'view' | 'edit';
}
