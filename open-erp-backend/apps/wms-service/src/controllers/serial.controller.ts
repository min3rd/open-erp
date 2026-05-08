import {
  Controller,
  Get,
  Post,
  Patch,
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
import { created, ok, updated, paginated } from '@shared/response';
import { WmsSerialService } from '../services/serial.service';
import { CreateSerialDto, UpdateSerialDto, QuerySerialDto } from '../dto/serial.dto';

@ApiTags('wms-serials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('wms/serials')
export class SerialController {
  constructor(private readonly serialService: WmsSerialService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách serial (filter: skuId, status, binId)' })
  @ApiResponse({ status: 200, description: 'Danh sách serial' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query() query: QuerySerialDto,
  ) {
    const tenantId = user.organizationId!;
    const result = await this.serialService.findAll(query, tenantId);
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký serial mới' })
  @ApiResponse({ status: 201, description: 'Serial được đăng ký thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateSerialDto,
  ) {
    const tenantId = user.organizationId!;
    const serial = await this.serialService.create(dto, tenantId);
    return created(serial, 'Serial registered successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết serial' })
  @ApiResponse({ status: 200, description: 'Chi tiết serial' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = user.organizationId!;
    const serial = await this.serialService.findById(id, tenantId);
    return ok(serial);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trạng thái serial' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateSerialDto,
  ) {
    const tenantId = user.organizationId!;
    const serial = await this.serialService.update(id, dto, tenantId);
    return updated(serial, 'Serial updated successfully');
  }
}
