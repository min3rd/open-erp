import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttachmentDto } from './send-message.dto';

export class EditMessageDto {
  @ApiPropertyOptional({
    description: 'New text content for the message',
    example: 'Updated message content',
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  content?: string;

  @ApiPropertyOptional({
    description: 'New attachments for the message',
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
