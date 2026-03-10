import {
  Controller,
  Get,
  Post,
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
import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  CurrentUser,
} from '@shared/authz';
import { Permission } from '@shared/types/permission.enum';
import { ok, created, fetched, paginated } from '@shared/response';
import { ApprovalRequestService } from '../services/approval-request.service';
import {
  CreateApprovalRequestDto,
  SubmitApprovalActionDto,
} from '../dto/approval-request.dto';
import { ApprovalRequestStatus } from '@shared/schemas/approval-request.schema';

@ApiTags('approval-requests')
@Controller('approval-flow/requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ApprovalRequestController {
  constructor(private readonly requestService: ApprovalRequestService) {}

  @Post()
  @Permissions(
    [Permission.APPROVAL_REQUEST_CREATE, Permission.APPROVAL_REQUEST_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Create a new approval request' })
  async create(
    @Body() dto: CreateApprovalRequestDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.requestService.create(dto, user.userId);
    return created(result, 'Approval request created successfully');
  }

  @Get()
  @Permissions(
    [Permission.APPROVAL_REQUEST_READ, Permission.APPROVAL_REQUEST_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'List approval requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ApprovalRequestStatus })
  @ApiQuery({ name: 'requestedBy', required: false })
  @ApiQuery({ name: 'approverId', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('orgId') orgId?: string,
    @Query('status') status?: ApprovalRequestStatus,
    @Query('requestedBy') requestedBy?: string,
    @Query('approverId') approverId?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.requestService.findAll(
      { entityType, entityId, orgId, status, requestedBy, approverId },
      page,
      limit,
      sortField,
      sortOrder,
    );
    return paginated(result.items, page, limit, result.total);
  }

  @Get(':id')
  @Permissions(
    [Permission.APPROVAL_REQUEST_READ, Permission.APPROVAL_REQUEST_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Get an approval request by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.requestService.findById(id);
    return fetched(result);
  }

  @Post(':id/action')
  @Permissions(
    [Permission.APPROVAL_REQUEST_ACTION, Permission.APPROVAL_REQUEST_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({
    summary:
      'Submit an approval action (APPROVE, REJECT, REQUEST_CHANGES, SHARE)',
  })
  async submitAction(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalActionDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.requestService.submitAction(id, dto, user.userId);
    return ok(result, 'Action submitted successfully');
  }

  @Post(':id/cancel')
  @Permissions(
    [Permission.APPROVAL_REQUEST_CREATE, Permission.APPROVAL_REQUEST_MANAGE],
    { mode: 'any' },
  )
  @ApiOperation({ summary: 'Cancel an approval request' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.requestService.cancel(id, user.userId);
    return ok(result, 'Approval request cancelled successfully');
  }
}
