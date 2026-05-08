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
import { WmsLotService } from '../services/lot.service';
import { CreateLotDto, UpdateLotDto, QueryLotDto } from '../dto/lot.dto';

@ApiTags('wms-lots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('wms/lots')
export class LotController {
  constructor(private readonly lotService: WmsLotService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách lot (filter: skuId, expired)' })
  @ApiResponse({ status: 200, description: 'Danh sách lot' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query() query: QueryLotDto,
  ) {
    const tenantId = user.organizationId!;
    const result = await this.lotService.findAll(query, tenantId);
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lot mới' })
  @ApiResponse({ status: 201, description: 'Lot được tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateLotDto,
  ) {
    const tenantId = user.organizationId!;
    const lot = await this.lotService.create(dto, tenantId);
    return created(lot, 'Lot created successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết lot' })
  @ApiResponse({ status: 200, description: 'Chi tiết lot' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = user.organizationId!;
    const lot = await this.lotService.findById(id, tenantId);
    return ok(lot);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật lot' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateLotDto,
  ) {
    const tenantId = user.organizationId!;
    const lot = await this.lotService.update(id, dto, tenantId);
    return updated(lot, 'Lot updated successfully');
  }
}
