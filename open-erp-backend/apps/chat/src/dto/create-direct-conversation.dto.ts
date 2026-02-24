import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectConversationDto {
  @ApiProperty({
    description: 'User ID of the other participant in the direct conversation',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Participant ID is required' })
  @IsString({ message: 'Participant ID must be a string' })
  @IsMongoId({ message: 'Participant ID must be a valid MongoDB ObjectId' })
  participantId: string;
}
