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
import { AisleService } from '../services/aisle.service';
import { CreateAisleDto, UpdateAisleDto, QueryAisleDto } from '../dto/aisle.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { created, fetched, updated, deleted, paginated } from '@shared/response';

@ApiTags('aisles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AisleController {
  constructor(private readonly aisleService: AisleService) {}

  @Post('zones/:zoneId/aisles')
  @ApiOperation({ summary: 'Create an aisle in a zone' })
  @ApiParam({ name: 'zoneId', description: 'Zone ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Aisle created successfully' })
  @Permissions('inventory.aisle.create')
  async create(@Param('zoneId') zoneId: string, @Body() dto: CreateAisleDto) {
    const aisle = await this.aisleService.create(zoneId, dto);
    return created(aisle, 'Aisle created successfully');
  }

  @Get('zones/:zoneId/aisles')
  @ApiOperation({ summary: 'List aisles in a zone' })
  @ApiParam({ name: 'zoneId', description: 'Zone ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Aisles retrieved successfully' })
  @Permissions('inventory.aisle.read')
  async findAll(@Param('zoneId') zoneId: string, @Query() query: QueryAisleDto) {
    const { items, total, page, limit } = await this.aisleService.findAll(zoneId, query);
    return paginated(items, page, limit, total);
  }

  @Get('aisles/:id')
  @ApiOperation({ summary: 'Get an aisle by ID' })
  @ApiParam({ name: 'id', description: 'Aisle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Aisle retrieved successfully' })
  @Permissions('inventory.aisle.read')
  async findById(@Param('id') id: string) {
    const aisle = await this.aisleService.findById(id);
    return fetched(aisle, 'Aisle retrieved successfully');
  }

  @Put('aisles/:id')
  @ApiOperation({ summary: 'Update an aisle' })
  @ApiParam({ name: 'id', description: 'Aisle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Aisle updated successfully' })
  @Permissions('inventory.aisle.update')
  async update(@Param('id') id: string, @Body() dto: UpdateAisleDto) {
    const aisle = await this.aisleService.update(id, dto);
    return updated(aisle, 'Aisle updated successfully');
  }

  @Delete('aisles/:id')
  @ApiOperation({ summary: 'Delete an aisle (soft delete)' })
  @ApiParam({ name: 'id', description: 'Aisle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Aisle deleted successfully' })
  @Permissions('inventory.aisle.delete')
  async delete(@Param('id') id: string) {
    await this.aisleService.delete(id);
    return deleted('Aisle deleted successfully');
  }
}
