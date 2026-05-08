import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
