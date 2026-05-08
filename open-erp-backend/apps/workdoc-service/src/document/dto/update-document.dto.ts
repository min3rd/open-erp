import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Tiêu đề tài liệu' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Nội dung tài liệu' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: 'URL file đính kèm' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'MIME type của file' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Tags phân loại', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
