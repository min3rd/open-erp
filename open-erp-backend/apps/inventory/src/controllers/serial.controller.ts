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
import { SerialService } from '../services/serial.service';
import { CreateSerialDto, UpdateSerialDto } from '../dto/serial.dto';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { SerialStatus } from '@shared/schemas';

@ApiTags('inventory-serials')
@Controller('inventory/serials')
export class SerialController {
  constructor(private readonly serialService: SerialService) {}

  @Get()
  @ApiOperation({ summary: 'List serials with optional filters' })
  @ApiQuery({ name: 'skuId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SerialStatus })
  @ApiQuery({ name: 'binId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Serials retrieved successfully' })
  async findAll(
    @Query('skuId') skuId?: string,
    @Query('status') status?: SerialStatus,
    @Query('binId') binId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.serialService.findAll(
        { skuId, status, binId },
        { page, limit },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SERIAL_FETCH_ERROR', err.message || 'Failed to fetch serials'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Register a new serial number' })
  @ApiResponse({ status: 201, description: 'Serial registered successfully' })
  async create(@Body() createDto: CreateSerialDto) {
    try {
      const serial = await this.serialService.create(createDto);
      return created(serial, 'Serial registered successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'SERIAL_CREATE_ERROR',
          err.message || 'Failed to register serial',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get serial by ID' })
  @ApiParam({ name: 'id', description: 'Serial ID' })
  @ApiResponse({ status: 200, description: 'Serial retrieved successfully' })
  async findById(@Param('id') id: string) {
    try {
      const serial = await this.serialService.findById(id);
      return fetched(serial);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('SERIAL_FETCH_ERROR', err.message || 'Failed to fetch serial'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a serial' })
  @ApiParam({ name: 'id', description: 'Serial ID' })
  @ApiResponse({ status: 200, description: 'Serial updated successfully' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSerialDto) {
    try {
      const serial = await this.serialService.update(id, updateDto);
      return ok(serial, 'Serial updated successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'SERIAL_UPDATE_ERROR',
          err.message || 'Failed to update serial',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
