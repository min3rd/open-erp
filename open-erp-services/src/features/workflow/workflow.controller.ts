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
  Query,
} from '@nestjs/common';
import { WorkflowService } from '../../core/workflow/workflow.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @Req() req: any) {
    const tenantId = req.tenantId;
    const workflow = await this.workflowService.createWorkflow(tenantId, body);
    return {
      success: true,
      data: {
        workflowId: workflow.id,
      },
    };
  }

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.tenantId;
    const workflows = await this.workflowService.findAllWorkflows(tenantId);
    return {
      success: true,
      data: workflows,
    };
  }

  @Get('analytics/performance')
  async getPerformanceAnalytics(@Query() query: { startDate?: string; endDate?: string }, @Req() req: any) {
    const tenantId = req.tenantId;
    const stats = await this.workflowService.getPerformanceAnalytics(tenantId, query);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const workflow = await this.workflowService.getWorkflowById(id, tenantId);
    return {
      success: true,
      data: workflow,
    };
  }
}
