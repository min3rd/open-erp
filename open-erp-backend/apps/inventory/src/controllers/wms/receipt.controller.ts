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
import { ReceiptService } from '../../services/wms/receipt.service';
import {
  CreateReceiptDto,
  ReceiveReceiptDto,
  QcReceiptDto,
} from '../../dto/wms/receipt.dto';
import { ReceiptStatus } from '@shared/schemas';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { Permission } from '@shared/types/permission.enum';

@ApiTags('wms-receipts')
@Controller('wms/receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  @Permissions(Permission.WMS_RECEIPT_CREATE)
  @ApiOperation({ summary: 'Create a new receipt (from PO or manual)' })
  @ApiResponse({ status: 201, description: 'Receipt created successfully' })
  async create(@Body() createDto: CreateReceiptDto) {
    try {
      const receipt = await this.receiptService.create(createDto);
      return created(receipt, 'Receipt created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_CREATE_ERROR', err.message || 'Failed to create receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'List receipts with filters, search and sort' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'poId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ReceiptStatus })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Text search (poId, supplier, notes)' })
  @ApiQuery({ name: 'sortField', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: Number, description: 'Sort direction: 1 asc, -1 desc (default: -1)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Receipts retrieved successfully' })
  async findAll(
    @Query('orgId') orgId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('poId') poId?: string,
    @Query('status') status?: ReceiptStatus,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const parsedSortOrder = sortOrder ? (parseInt(sortOrder as string, 10) as 1 | -1) : undefined;
      const result = await this.receiptService.findAll(
        { orgId, warehouseId, poId, status, q },
        { page, limit, sortField, sortOrder: parsedSortOrder },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_FETCH_ERROR', err.message || 'Failed to fetch receipts'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt retrieved successfully' })
  async findById(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.findById(id);
      return fetched(receipt);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_FETCH_ERROR', err.message || 'Failed to fetch receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/receive')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Record receipt of goods (partial or full)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt updated successfully' })
  async receive(@Param('id') id: string, @Body() dto: ReceiveReceiptDto) {
    try {
      const receipt = await this.receiptService.receive(id, dto);
      return ok(receipt, 'Receipt updated successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_RECEIVE_ERROR', err.message || 'Failed to process receive'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/qc')
  @Permissions(Permission.WMS_QC_MANAGE)
  @ApiOperation({ summary: 'Apply QC result to receipt lines' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'QC applied successfully' })
  async applyQc(@Param('id') id: string, @Body() dto: QcReceiptDto) {
    try {
      const receipt = await this.receiptService.applyQc(id, dto);
      return ok(receipt, 'QC applied successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_QC_ERROR', err.message || 'Failed to apply QC'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/complete')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Complete a receipt after QC passed' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt completed successfully' })
  async complete(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.complete(id);
      return ok(receipt, 'Receipt completed successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_COMPLETE_ERROR', err.message || 'Failed to complete receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
