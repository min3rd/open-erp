import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Loại entity (ví dụ: purchase_order, leave_request)' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'ID của entity cần duyệt' })
  @IsString()
  @IsNotEmpty()
  entityId: string;
}
