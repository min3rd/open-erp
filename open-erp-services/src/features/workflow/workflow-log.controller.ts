import { Controller, Get, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { WorkflowLogService } from '../../core/workflow/workflow-log.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowLogController {
  constructor(private readonly logService: WorkflowLogService) {}

  @Get('logs/:instanceId/verify')
  async verifyLogs(@Param('instanceId') instanceId: string) {
    const result = await this.logService.verifyChain(instanceId);

    if (!result.verified) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SECURITY_COMPROMISED',
          message: `Phát hiện dấu vết dữ liệu bị chỉnh sửa trái phép tại bản ghi nhật ký ID: ${result.corruptedLogId}`,
          corruptedLogId: result.corruptedLogId,
        },
      });
    }

    return {
      success: true,
      data: {
        verified: true,
        integrityCheckedAt: new Date().toISOString(),
      },
    };
  }
}
