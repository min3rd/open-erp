import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ApproveWorkflowDto } from './dto/approve-workflow.dto';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';

@ApiTags('workdoc-workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('workdoc/workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách workflow request của tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách workflow' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.workflowService.findAll(user.organizationId!, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo workflow request' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateWorkflowDto,
  ) {
    return this.workflowService.create(user.organizationId!, dto, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết workflow request' })
  @ApiResponse({ status: 200, description: 'Chi tiết' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.workflowService.findOne(user.organizationId!, id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Duyệt workflow request' })
  @ApiResponse({ status: 200, description: 'Đã duyệt' })
  async approve(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: ApproveWorkflowDto,
  ) {
    return this.workflowService.approve(
      user.organizationId!,
      id,
      user.userId,
      dto.comment,
    );
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Từ chối workflow request' })
  @ApiResponse({ status: 200, description: 'Đã từ chối' })
  async reject(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: ApproveWorkflowDto,
  ) {
    return this.workflowService.reject(
      user.organizationId!,
      id,
      user.userId,
      dto.comment,
    );
  }
}
