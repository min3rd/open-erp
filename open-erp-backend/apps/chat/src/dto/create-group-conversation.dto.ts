import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsMongoId,
  ArrayMinSize,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupConversationDto {
  @ApiProperty({
    description: 'Name of the group conversation',
    example: 'Project Alpha Team',
  })
  @IsNotEmpty({ message: 'Group name is required' })
  @IsString({ message: 'Group name must be a string' })
  name: string;

  @ApiProperty({
    description: 'Array of user IDs to add as participants',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray({ message: 'Participant IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one participant is required' })
  @IsMongoId({
    each: true,
    message: 'Each participant ID must be a valid MongoDB ObjectId',
  })
  participantIds: string[];

  @ApiPropertyOptional({
    description: 'Avatar URL for the group',
    example: 'https://example.com/group-avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}
