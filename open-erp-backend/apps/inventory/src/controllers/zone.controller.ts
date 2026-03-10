import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ZoneService } from '../services/zone.service';
import { CreateZoneDto, UpdateZoneDto, QueryZoneDto } from '../dto/zone.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import {
  created,
  fetched,
  updated,
  deleted,
  paginated,
} from '@shared/response';

@ApiTags('zones')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post('warehouses/:warehouseId/zones')
  @ApiOperation({ summary: 'Create a zone in a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Zone created successfully',
  })
  @Permissions('inventory.zone.create')
  async create(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: CreateZoneDto,
  ) {
    const zone = await this.zoneService.create(warehouseId, dto);
    return created(zone, 'Zone created successfully');
  }

  @Get('warehouses/:warehouseId/zones')
  @ApiOperation({ summary: 'List zones in a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zones retrieved successfully',
  })
  @Permissions('inventory.zone.read')
  async findAll(
    @Param('warehouseId') warehouseId: string,
    @Query() query: QueryZoneDto,
  ) {
    const { items, total, page, limit } = await this.zoneService.findAll(
      warehouseId,
      query,
    );
    return paginated(items, page, limit, total);
  }

  @Put('zones/:id')
  @ApiOperation({ summary: 'Update a zone' })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zone updated successfully',
  })
  @Permissions('inventory.zone.update')
  async update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    const zone = await this.zoneService.update(id, dto);
    return updated(zone, 'Zone updated successfully');
  }

  @Get('zones/:id')
  @ApiOperation({ summary: 'Get a zone by ID' })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zone retrieved successfully',
  })
  @Permissions('inventory.zone.read')
  async findById(@Param('id') id: string) {
    const zone = await this.zoneService.findById(id);
    return fetched(zone, 'Zone retrieved successfully');
  }

  @Delete('zones/:id')
  @ApiOperation({ summary: 'Delete a zone (soft delete)' })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zone deleted successfully',
  })
  @Permissions('inventory.zone.delete')
  async delete(@Param('id') id: string) {
    await this.zoneService.delete(id);
    return deleted('Zone deleted successfully');
  }
}
