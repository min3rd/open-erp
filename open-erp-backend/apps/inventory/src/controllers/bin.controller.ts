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
  ApiQuery,
} from '@nestjs/swagger';
import { BinService } from '../services/bin.service';
import { CreateBinDto, UpdateBinDto, QueryBinDto } from '../dto/bin.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { created, fetched, updated, deleted, paginated, ok } from '@shared/response';

@ApiTags('bins')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class BinController {
  constructor(private readonly binService: BinService) {}

  @Post('aisles/:aisleId/bins')
  @ApiOperation({ summary: 'Create a bin in an aisle' })
  @ApiParam({ name: 'aisleId', description: 'Aisle ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bin created successfully' })
  @Permissions('inventory.bin.create')
  async create(@Param('aisleId') aisleId: string, @Body() dto: CreateBinDto) {
    const bin = await this.binService.create(aisleId, dto);
    return created(bin, 'Bin created successfully');
  }

  @Get('aisles/:aisleId/bins')
  @ApiOperation({ summary: 'List bins in an aisle' })
  @ApiParam({ name: 'aisleId', description: 'Aisle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bins retrieved successfully' })
  @Permissions('inventory.bin.read')
  async findAll(@Param('aisleId') aisleId: string, @Query() query: QueryBinDto) {
    const { items, total, page, limit } = await this.binService.findAll(aisleId, query);
    return paginated(items, page, limit, total);
  }

  @Get('bins/:id')
  @ApiOperation({ summary: 'Get a bin by ID' })
  @ApiParam({ name: 'id', description: 'Bin ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bin retrieved successfully' })
  @Permissions('inventory.bin.read')
  async findById(@Param('id') id: string) {
    const bin = await this.binService.findById(id);
    return fetched(bin, 'Bin retrieved successfully');
  }

  @Put('bins/:id')
  @ApiOperation({ summary: 'Update a bin' })
  @ApiParam({ name: 'id', description: 'Bin ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bin updated successfully' })
  @Permissions('inventory.bin.update')
  async update(@Param('id') id: string, @Body() dto: UpdateBinDto) {
    const bin = await this.binService.update(id, dto);
    return updated(bin, 'Bin updated successfully');
  }

  @Delete('bins/:id')
  @ApiOperation({ summary: 'Delete a bin (soft delete, blocked if stock > 0 unless force=true)' })
  @ApiParam({ name: 'id', description: 'Bin ID' })
  @ApiQuery({ name: 'force', description: 'Force delete even if currentQty > 0', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bin deleted successfully' })
  @Permissions('inventory.bin.delete')
  async delete(@Param('id') id: string, @Query('force') force?: string) {
    await this.binService.delete(id, force === 'true');
    return deleted('Bin deleted successfully');
  }

  @Post('bins/:id/block')
  @ApiOperation({ summary: 'Block a bin (prevent putaway)' })
  @ApiParam({ name: 'id', description: 'Bin ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bin blocked successfully' })
  @Permissions('inventory.bin.update')
  async block(@Param('id') id: string) {
    const bin = await this.binService.block(id);
    return ok(bin, 'Bin blocked successfully');
  }

  @Post('bins/:id/unblock')
  @ApiOperation({ summary: 'Unblock a bin' })
  @ApiParam({ name: 'id', description: 'Bin ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bin unblocked successfully' })
  @Permissions('inventory.bin.update')
  async unblock(@Param('id') id: string) {
    const bin = await this.binService.unblock(id);
    return ok(bin, 'Bin unblocked successfully');
  }
}
