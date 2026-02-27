import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { LayoutService } from '../services/layout.service';
import {
  CreateLayoutDto,
  UpdateLayoutDto,
  CreateLayoutObjectDto,
  UpdateLayoutObjectDto,
  QueryLayoutObjectDto,
} from '../dto/layout.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { created, fetched, updated, deleted, ok, paginated } from '@shared/response';

@ApiTags('warehouse-layout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  // ─── Layout endpoints ─────────────────────────────────────────────────────

  @Get('warehouses/:warehouseId/layout')
  @ApiOperation({ summary: 'Get warehouse layout and all layout objects' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Warehouse not found' })
  @Permissions('inventory.warehouse.read')
  async getLayout(@Param('warehouseId') warehouseId: string) {
    const data = await this.layoutService.getLayout(warehouseId);
    return ok(data, 'Layout retrieved successfully');
  }

  @Post('warehouses/:warehouseId/layout')
  @ApiOperation({ summary: 'Create initial layout for a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Layout created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Layout already exists' })
  @Permissions('inventory.warehouse.structure.manage')
  async createLayout(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: CreateLayoutDto,
  ) {
    const layout = await this.layoutService.createLayout(warehouseId, dto);
    return created(layout, 'Layout created successfully');
  }

  @Put('warehouses/:warehouseId/layout')
  @ApiOperation({ summary: 'Update warehouse layout metadata (resize)' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Layout not found' })
  @Permissions('inventory.warehouse.structure.manage')
  async updateLayout(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: UpdateLayoutDto,
  ) {
    const layout = await this.layoutService.updateLayout(warehouseId, dto);
    return updated(layout, 'Layout updated successfully');
  }

  // ─── Layout object endpoints ──────────────────────────────────────────────

  @Get('warehouses/:warehouseId/layout/objects')
  @ApiOperation({ summary: 'Get all layout objects for a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by object type (zone|aisle|bin)' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout objects retrieved successfully' })
  @Permissions('inventory.warehouse.read')
  async getObjects(
    @Param('warehouseId') warehouseId: string,
    @Query() query: QueryLayoutObjectDto,
  ) {
    const { items, total, page, limit } = await this.layoutService.getObjects(warehouseId, query);
    return paginated(items, page, limit, total);
  }

  @Post('warehouses/:warehouseId/layout/objects')
  @ApiOperation({ summary: 'Create a new layout object (zone/aisle/bin)' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Layout object created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Code already exists' })
  @Permissions('inventory.warehouse.structure.manage')
  async createObject(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: CreateLayoutObjectDto,
  ) {
    const obj = await this.layoutService.createObject(warehouseId, dto);
    return created(obj, 'Layout object created successfully');
  }

  @Post('warehouses/:warehouseId/layout/objects/batch')
  @ApiOperation({ summary: 'Batch create or update layout objects' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch save completed' })
  @Permissions('inventory.warehouse.structure.manage')
  async batchSaveObjects(
    @Param('warehouseId') warehouseId: string,
    @Body() body: { objects: Array<CreateLayoutObjectDto & { id?: string }> },
  ) {
    const results = await this.layoutService.batchSaveObjects(warehouseId, body.objects ?? []);
    return ok(results, 'Batch save completed');
  }

  @Get('layout/objects/:id')
  @ApiOperation({ summary: 'Get a single layout object by ID' })
  @ApiParam({ name: 'id', description: 'Layout object ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout object retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @Permissions('inventory.warehouse.read')
  async getObject(@Param('id') id: string) {
    const obj = await this.layoutService.getObjectById(id);
    return fetched(obj, 'Layout object retrieved');
  }

  @Patch('layout/objects/:id')
  @ApiOperation({ summary: 'Update layout object (position, size, properties)' })
  @ApiParam({ name: 'id', description: 'Layout object ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout object updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @Permissions('inventory.warehouse.structure.manage')
  async updateObject(
    @Param('id') id: string,
    @Body() dto: UpdateLayoutObjectDto,
  ) {
    const obj = await this.layoutService.updateObject(id, dto);
    return updated(obj, 'Layout object updated');
  }

  @Delete('layout/objects/:id')
  @ApiOperation({ summary: 'Delete a layout object (soft delete)' })
  @ApiParam({ name: 'id', description: 'Layout object ID' })
  @ApiQuery({ name: 'force', required: false, description: 'Force delete even if has children' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Layout object deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Has children – use force=true' })
  @Permissions('inventory.warehouse.structure.manage')
  async deleteObject(
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    await this.layoutService.deleteObject(id, force === 'true');
    return deleted('Layout object deleted successfully');
  }
}
