import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveWorkflowDto {
  @ApiPropertyOptional({ description: 'Ghi chú khi duyệt hoặc từ chối' })
  @IsOptional()
  @IsString()
  comment?: string;
}
