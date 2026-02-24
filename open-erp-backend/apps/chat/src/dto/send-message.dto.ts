import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MessageType } from '@shared/schemas';

export class AttachmentDto {
  @ApiProperty({
    description: 'URL of the attachment',
    example: 'https://files.example.com/image.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl({}, { message: 'Attachment URL must be a valid URL' })
  url: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'photo.jpg',
  })
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNotEmpty()
  @IsNumber()
  size: number;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the conversation to send the message to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Conversation ID is required' })
  @IsString()
  @IsMongoId({ message: 'Conversation ID must be a valid MongoDB ObjectId' })
  conversationId: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsNotEmpty({ message: 'Message type is required' })
  @IsEnum(MessageType, { message: 'Invalid message type' })
  type: MessageType;

  @ApiPropertyOptional({
    description: 'Text content of the message (required for text messages)',
    example: 'Hello, how are you?',
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Array of attachments (for multimedia messages)',
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
