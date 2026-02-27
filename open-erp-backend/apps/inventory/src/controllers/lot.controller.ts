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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LotService } from '../services/lot.service';
import { CreateLotDto, UpdateLotDto } from '../dto/lot.dto';
import { created, fetched, paginated, error, ok } from '@shared/response';

@ApiTags('inventory-lots')
@Controller('inventory/lots')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Get()
  @ApiOperation({ summary: 'List lots with optional filters' })
  @ApiQuery({ name: 'skuId', required: false, type: String })
  @ApiQuery({ name: 'expired', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lots retrieved successfully' })
  async findAll(
    @Query('skuId') skuId?: string,
    @Query('expired') expired?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const expiredBool =
        expired === 'true' ? true : expired === 'false' ? false : undefined;
      const result = await this.lotService.findAll(
        { skuId, expired: expiredBool },
        { page, limit },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('LOT_FETCH_ERROR', err.message || 'Failed to fetch lots'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lot' })
  @ApiResponse({ status: 201, description: 'Lot created successfully' })
  async create(@Body() createDto: CreateLotDto) {
    try {
      const lot = await this.lotService.create(createDto);
      return created(lot, 'Lot created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('LOT_CREATE_ERROR', err.message || 'Failed to create lot'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lot by ID' })
  @ApiParam({ name: 'id', description: 'Lot ID' })
  @ApiResponse({ status: 200, description: 'Lot retrieved successfully' })
  async findById(@Param('id') id: string) {
    try {
      const lot = await this.lotService.findById(id);
      return fetched(lot);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('LOT_FETCH_ERROR', err.message || 'Failed to fetch lot'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lot' })
  @ApiParam({ name: 'id', description: 'Lot ID' })
  @ApiResponse({ status: 200, description: 'Lot updated successfully' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateLotDto) {
    try {
      const lot = await this.lotService.update(id, updateDto);
      return ok(lot, 'Lot updated successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('LOT_UPDATE_ERROR', err.message || 'Failed to update lot'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
