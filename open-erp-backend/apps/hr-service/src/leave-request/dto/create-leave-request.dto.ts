import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty({ enum: ['annual', 'sick', 'unpaid'] })
  @IsString()
  @IsIn(['annual', 'sick', 'unpaid'])
  leaveType: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
