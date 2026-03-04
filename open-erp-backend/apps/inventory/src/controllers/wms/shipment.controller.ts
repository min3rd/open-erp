import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ShipmentService } from '../../services/wms/shipment.service';
import {
  CreateShipmentDto,
  ShipShipmentDto,
} from '../../dto/wms/shipment.dto';
import { ShipmentStatus } from '@shared/schemas';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { Permission } from '@shared/types/permission.enum';

@ApiTags('wms-shipments')
@Controller('wms/shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @Permissions(Permission.WMS_SHIP_MANAGE)
  @ApiOperation({ summary: 'Create a shipment (link packages/orders)' })
  @ApiResponse({ status: 201, description: 'Shipment created successfully' })
  async create(@Body() dto: CreateShipmentDto) {
    try {
      const shipment = await this.shipmentService.create(dto);
      return created(shipment, 'Shipment created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SHIPMENT_CREATE_ERROR', err.message || 'Failed to create shipment'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Permissions(Permission.WMS_SHIP_MANAGE)
  @ApiOperation({ summary: 'List shipments with filters' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Shipments retrieved successfully' })
  async findAll(
    @Query('orgId') orgId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: ShipmentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.shipmentService.findAll(
        { orgId, warehouseId, status },
        { page, limit },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SHIPMENT_FETCH_ERROR', err.message || 'Failed to fetch shipments'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Permissions(Permission.WMS_SHIP_MANAGE)
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment retrieved successfully' })
  async findById(@Param('id') id: string) {
    try {
      const shipment = await this.shipmentService.findById(id);
      return fetched(shipment);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SHIPMENT_FETCH_ERROR', err.message || 'Failed to fetch shipment'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/ship')
  @Permissions(Permission.WMS_SHIP_MANAGE)
  @ApiOperation({ summary: 'Mark shipment as shipped (supports partial shipments)' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment marked as shipped' })
  async ship(@Param('id') id: string, @Body() dto: ShipShipmentDto) {
    try {
      const shipment = await this.shipmentService.ship(id, dto);
      return ok(shipment, 'Shipment dispatched successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SHIPMENT_SHIP_ERROR', err.message || 'Failed to dispatch shipment'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/deliver')
  @Permissions(Permission.WMS_SHIP_MANAGE)
  @ApiOperation({ summary: 'Mark shipment as delivered' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment marked as delivered' })
  async markDelivered(@Param('id') id: string) {
    try {
      const shipment = await this.shipmentService.markDelivered(id);
      return ok(shipment, 'Shipment marked as delivered');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SHIPMENT_DELIVER_ERROR', err.message || 'Failed to mark as delivered'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
