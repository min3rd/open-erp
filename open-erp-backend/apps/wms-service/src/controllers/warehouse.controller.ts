import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';
import { created, ok, updated, deleted, paginated } from '@shared/response';
import { WmsWarehouseService } from '../services/warehouse.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseDto,
} from '../dto/warehouse.dto';

@ApiTags('wms-warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('wms/warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WmsWarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách kho theo tenant (phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách kho' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query() query: QueryWarehouseDto,
  ) {
    const tenantId = user.organizationId!;
    const result = await this.warehouseService.findAll(query, tenantId);
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới kho' })
  @ApiResponse({ status: 201, description: 'Kho được tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateWarehouseDto,
  ) {
    const tenantId = user.organizationId!;
    const warehouse = await this.warehouseService.create(dto, user.userId, tenantId);
    return created(warehouse, 'Warehouse created successfully');
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Danh sách tỉnh/thành phố' })
  async getProvinces() {
    const data = await this.warehouseService.getProvinces();
    return ok(data);
  }

  @Get('provinces/:code/wards')
  @ApiOperation({ summary: 'Danh sách phường/xã theo tỉnh' })
  async getWardsByProvince(@Param('code') code: string) {
    const data = await this.warehouseService.getWardsByProvince(code);
    return ok(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 kho' })
  @ApiResponse({ status: 200, description: 'Chi tiết kho' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = user.organizationId!;
    const warehouse = await this.warehouseService.findById(id, tenantId);
    return ok(warehouse);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật kho' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const tenantId = user.organizationId!;
    const warehouse = await this.warehouseService.update(id, dto, user.userId, tenantId);
    return updated(warehouse, 'Warehouse updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm kho' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = user.organizationId!;
    await this.warehouseService.softDelete(id, tenantId);
    return deleted('Warehouse deleted successfully');
  }
}
