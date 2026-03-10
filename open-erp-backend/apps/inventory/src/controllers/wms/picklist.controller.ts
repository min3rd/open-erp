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
import { PicklistService } from '../../services/wms/picklist.service';
import {
  CreatePicklistDto,
  PickDto,
  CreatePackageDto,
} from '../../dto/wms/picklist.dto';
import { PicklistStatus, WmsPackageStatus } from '@shared/schemas';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { Permission } from '@shared/types/permission.enum';

@ApiTags('wms-picklists')
@Controller('wms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PicklistController {
  constructor(private readonly picklistService: PicklistService) {}

  @Post('picklists')
  @Permissions(Permission.WMS_PICK_MANAGE)
  @ApiOperation({ summary: 'Create a picklist for orders/shipments' })
  @ApiResponse({ status: 201, description: 'Picklist created successfully' })
  async createPicklist(@Body() dto: CreatePicklistDto) {
    try {
      const picklist = await this.picklistService.createPicklist(dto);
      return created(picklist, 'Picklist created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'PICKLIST_CREATE_ERROR',
          err.message || 'Failed to create picklist',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('picklists')
  @Permissions(Permission.WMS_PICK_MANAGE)
  @ApiOperation({ summary: 'List picklists with filters, search and sort' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PicklistStatus })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Text search (SKU, notes)',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: Number,
    description: 'Sort direction: 1 asc, -1 desc (default: -1)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Picklists retrieved successfully' })
  async findPicklists(
    @Query('orgId') orgId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: PicklistStatus,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const parsedSortOrder = sortOrder
        ? (parseInt(sortOrder as string, 10) as 1 | -1)
        : undefined;
      const result = await this.picklistService.findAll(
        { orgId, warehouseId, status, q },
        { page, limit, sortField, sortOrder: parsedSortOrder },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'PICKLIST_FETCH_ERROR',
          err.message || 'Failed to fetch picklists',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('picklists/:id')
  @Permissions(Permission.WMS_PICK_MANAGE)
  @ApiOperation({ summary: 'Get picklist by ID' })
  @ApiParam({ name: 'id', description: 'Picklist ID' })
  @ApiResponse({ status: 200, description: 'Picklist retrieved successfully' })
  async findPicklistById(@Param('id') id: string) {
    try {
      const picklist = await this.picklistService.findById(id);
      return fetched(picklist);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'PICKLIST_FETCH_ERROR',
          err.message || 'Failed to fetch picklist',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('picklists/:id/pick')
  @Permissions(Permission.WMS_PICK_MANAGE)
  @ApiOperation({ summary: 'Record picks for a picklist (scan-driven)' })
  @ApiParam({ name: 'id', description: 'Picklist ID' })
  @ApiResponse({ status: 200, description: 'Picks recorded successfully' })
  async pick(@Param('id') id: string, @Body() dto: PickDto) {
    try {
      const picklist = await this.picklistService.pick(id, dto);
      return ok(picklist, 'Picks recorded successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('PICKLIST_PICK_ERROR', err.message || 'Failed to record picks'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Package endpoints
  @Post('packages')
  @Permissions(Permission.WMS_PACK_MANAGE)
  @ApiOperation({ summary: 'Create a package from picked items' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  async createPackage(@Body() dto: CreatePackageDto) {
    try {
      const pkg = await this.picklistService.createPackage(dto);
      return created(pkg, 'Package created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'PACKAGE_CREATE_ERROR',
          err.message || 'Failed to create package',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('packages')
  @Permissions(Permission.WMS_PACK_MANAGE)
  @ApiOperation({ summary: 'List packages with filters, search and sort' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  @ApiQuery({ name: 'shipmentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: WmsPackageStatus })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Text search (trackingNumber, notes)',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: Number,
    description: 'Sort direction: 1 asc, -1 desc (default: -1)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async findPackages(
    @Query('orgId') orgId?: string,
    @Query('shipmentId') shipmentId?: string,
    @Query('status') status?: WmsPackageStatus,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const parsedSortOrder = sortOrder
        ? (parseInt(sortOrder as string, 10) as 1 | -1)
        : undefined;
      const result = await this.picklistService.findPackages(
        { orgId, shipmentId, status, q },
        { page, limit, sortField, sortOrder: parsedSortOrder },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('PACKAGE_FETCH_ERROR', err.message || 'Failed to fetch packages'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('packages/:id')
  @Permissions(Permission.WMS_PACK_MANAGE)
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  async findPackageById(@Param('id') id: string) {
    try {
      const pkg = await this.picklistService.findPackageById(id);
      return fetched(pkg);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('PACKAGE_FETCH_ERROR', err.message || 'Failed to fetch package'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
