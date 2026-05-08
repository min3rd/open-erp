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
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';

@ApiTags('hr-leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('hr/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đơn nghỉ của tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách đơn nghỉ' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaveRequestService.findAll(user.organizationId!, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đơn nghỉ mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveRequestService.create(user.organizationId!, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn nghỉ' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn nghỉ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.leaveRequestService.findOne(user.organizationId!, id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Duyệt đơn nghỉ' })
  @ApiResponse({ status: 200, description: 'Duyệt thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async approve(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.leaveRequestService.approve(user.organizationId!, id, user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Từ chối đơn nghỉ' })
  @ApiResponse({ status: 200, description: 'Từ chối thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async reject(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
  ) {
    return this.leaveRequestService.reject(user.organizationId!, id, user.userId, dto);
  }
}
