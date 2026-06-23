import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpStatus,
  HttpCode,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WorkflowInstanceService } from '../../core/workflow/workflow-instance.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { WorkflowAction } from '../../core/workflow/entities/workflow-log.entity';

@Controller('workflow-instances')
@UseGuards(JwtAuthGuard)
export class WorkflowInstanceController {
  constructor(private readonly instanceService: WorkflowInstanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startInstance(
    @Body('workflowId') workflowId: string,
    @Body('contextData') contextData: any,
    @Req() req: any,
  ) {
    if (!workflowId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'WORKFLOW_REQUIRED',
          messageKey: 'workflow.workflow_id_required',
        },
      });
    }

    const tenantId = req.tenantId || null;
    const actorId = req.user.userId;

    const instance = await this.instanceService.startInstance(
      tenantId,
      workflowId,
      actorId,
      contextData || {},
    );

    return {
      success: true,
      data: {
        instanceId: instance.id,
        status: instance.status,
        currentStepIds: instance.currentStepIds,
      },
    };
  }

  @Post(':instanceId/actions')
  @HttpCode(HttpStatus.OK)
  async executeAction(
    @Param('instanceId') instanceId: string,
    @Body('stepId') stepId: string,
    @Body('action') action: WorkflowAction,
    @Body('comment') comment: string,
    @Body('consultantId') consultantId: string,
    @Body('formData') formData: any,
    @Body('subWorkflowId') subWorkflowId: string,
    @Req() req: any,
  ) {
    if (!stepId || !action) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'STEP_AND_ACTION_REQUIRED',
          messageKey: 'workflow.step_and_action_required',
        },
      });
    }

    const tenantId = req.tenantId || null;
    const actorId = req.user.userId;

    const instance = await this.instanceService.executeAction(tenantId, instanceId, actorId, {
      stepId,
      action,
      comment,
      consultantId,
      formData,
      subWorkflowId,
    });

    return {
      success: true,
      data: {
        status: instance.status,
        currentStepIds: instance.currentStepIds,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId || null;
    const instance = await this.instanceService.getInstanceById(id, tenantId);
    return {
      success: true,
      data: instance,
    };
  }
}
