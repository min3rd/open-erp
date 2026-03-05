import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard, Permissions, CurrentUser } from '@shared/authz';
import { Permission } from '@shared/types/permission.enum';
import { ok, created, updated, deleted, fetched, paginated } from '@shared/response';
import { WorkflowTemplateService } from '../services/workflow-template.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CloneWorkflowTemplateDto,
  UpdateStatusDto,
  ValidateWorkflowDto,
} from '../dto/workflow-template.dto';
import {
  ApprovalScope,
  TemplateStatus,
} from '@shared/schemas/approval-workflow-template.schema';

@ApiTags('workflow-templates')
@Controller('approval-flow/templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WorkflowTemplateController {
  constructor(
    private readonly templateService: WorkflowTemplateService,
  ) {}

  @Post()
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_CREATE, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Create a workflow template' })
  async create(
    @Body() dto: CreateWorkflowTemplateDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.templateService.create(dto, user.userId);
    return created(result, 'Workflow template created successfully');
  }

  @Get()
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_READ, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'List workflow templates' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ApprovalScope })
  @ApiQuery({ name: 'status', required: false, enum: TemplateStatus })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('entityType') entityType?: string,
    @Query('scope') scope?: ApprovalScope,
    @Query('status') status?: TemplateStatus,
    @Query('orgId') orgId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.templateService.findAll(
      { entityType, scope, orgId, departmentId, status, q },
      page,
      limit,
      sortField,
      sortOrder,
    );
    return paginated(result.items, page, limit, result.total);
  }

  @Post('validate')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_READ, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Validate workflow graph and rules' })
  async validate(@Body() dto: ValidateWorkflowDto) {
    const result = this.templateService.validateWorkflow(dto.nodes, dto.edges);
    return ok(result);
  }

  @Get('resolve')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_READ, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({
    summary: 'Resolve the applicable workflow template by scope priority',
  })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  async resolve(
    @Query('entityType') entityType: string,
    @Query('orgId') orgId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const result = await this.templateService.resolveTemplate(
      entityType,
      orgId,
      departmentId,
    );
    return fetched(result);
  }

  @Get(':id')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_READ, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Get a workflow template by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.templateService.findById(id);
    return fetched(result);
  }

  @Put(':id')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_UPDATE, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Update a workflow template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowTemplateDto,
  ) {
    const result = await this.templateService.update(id, dto);
    return updated(result, 'Workflow template updated successfully');
  }

  @Post(':id/publish')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Publish a workflow template' })
  async publish(@Param('id') id: string) {
    const result = await this.templateService.publish(id);
    return updated(result, 'Workflow template published successfully');
  }

  @Post(':id/archive')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Archive a workflow template' })
  async archive(@Param('id') id: string) {
    const result = await this.templateService.archive(id);
    return updated(result, 'Workflow template archived successfully');
  }

  @Patch(':id/status')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Change workflow template status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const result = await this.templateService.changeStatus(
      id,
      dto.status as TemplateStatus,
    );
    return updated(result, 'Workflow template status updated successfully');
  }

  @Post(':id/clone')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_CREATE, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Clone a workflow template' })
  async clone(
    @Param('id') id: string,
    @Body() dto: CloneWorkflowTemplateDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.templateService.clone(id, dto, user.userId);
    return created(result, 'Workflow template cloned successfully');
  }

  @Delete(':id')
  @Permissions(
    [Permission.APPROVAL_TEMPLATE_DELETE, Permission.APPROVAL_TEMPLATE_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Delete a workflow template (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.templateService.softDelete(id);
    return deleted('Workflow template deleted successfully');
  }
}
