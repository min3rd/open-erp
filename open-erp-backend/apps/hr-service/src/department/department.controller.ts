import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';

@ApiTags('hr-departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('hr/departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phòng ban của tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách phòng ban' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.departmentService.findAll(user.organizationId!, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phòng ban mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentService.create(user.organizationId!, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phòng ban' })
  @ApiResponse({ status: 200, description: 'Chi tiết phòng ban' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.departmentService.findOne(user.organizationId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentService.update(user.organizationId!, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng ban' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.departmentService.remove(user.organizationId!, id);
  }
}
