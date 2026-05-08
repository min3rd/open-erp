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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';

@ApiTags('hr-employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('hr/employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhân viên của tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.employeeService.findAll(user.organizationId!, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhân viên mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.create(user.organizationId!, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhân viên' })
  @ApiResponse({ status: 200, description: 'Chi tiết nhân viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.employeeService.findOne(user.organizationId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhân viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(user.organizationId!, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhân viên' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.employeeService.remove(user.organizationId!, id);
  }
}
