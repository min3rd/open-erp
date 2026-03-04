import {
  Controller,
  Get,
  Post,
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
import { InventoryService } from '../services/inventory.service';
import {
  CreateTransactionDto,
  StockAdjustmentDto,
  TransferStockDto,
} from '../dto/inventory.dto';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { InventoryTransactionType, TransactionStatus } from '@shared/constants';

@ApiTags('inventory')
@Controller('inventory')
// @UseGuards(AuthGuard) // TODO: Implement auth guard
// @ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock/product/:productId')
  @ApiOperation({
    summary: 'Get stock levels for a product across all warehouses',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Stock levels retrieved successfully',
  })
  async getStocksByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getStocksByProduct(productId, {
        page,
        limit,
      });
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'STOCK_FETCH_ERROR',
          err.message || 'Failed to fetch stock levels',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stock/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get all stock in a specific warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search by SKU or product name' })
  @ApiQuery({ name: 'sortField', required: false, type: String, description: 'Sort field (sku, name, available, reserved, inTransit, damaged, onHand)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: Number, description: 'Sort order: 1 = ascending, -1 = descending' })
  @ApiResponse({
    status: 200,
    description: 'Warehouse stock retrieved successfully',
  })
  async getStocksByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: number,
  ) {
    try {
      const result = await this.inventoryService.getStocksByWarehouse(
        warehouseId,
        {},
        { page, limit, q, sortField, sortOrder: sortOrder ? Number(sortOrder) : undefined },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error(
          'STOCK_FETCH_ERROR',
          err.message || 'Failed to fetch warehouse stock',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stock/:productId/:warehouseId')
  @ApiOperation({
    summary: 'Get stock level for a specific product in a specific warehouse',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock level retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  async getStockByProductAndWarehouse(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    try {
      const stock = await this.inventoryService.getStockByProductAndWarehouse(
        productId,
        warehouseId,
      );
      return fetched(stock);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'STOCK_FETCH_ERROR',
          err.message || 'Failed to fetch stock level',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Low stock alerts retrieved successfully',
  })
  async getLowStockAlerts(
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getLowStockAlert(
        organizationId,
        {
          page,
          limit,
        },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error(
          'ALERT_FETCH_ERROR',
          err.message || 'Failed to fetch low stock alerts',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts/expiring')
  @ApiOperation({ summary: 'Get expiring stock alerts' })
  @ApiQuery({
    name: 'daysUntilExpiry',
    required: false,
    type: Number,
    example: 30,
    description: 'Number of days until expiry',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Expiring stock alerts retrieved successfully',
  })
  async getExpiringStockAlerts(
    @Query('daysUntilExpiry') daysUntilExpiry?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getExpiringStockAlert(
        daysUntilExpiry || 30,
        { page, limit },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error(
          'ALERT_FETCH_ERROR',
          err.message || 'Failed to fetch expiring stock alerts',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('transactions')
  @ApiOperation({
    summary: 'Create an inventory transaction (IN/OUT/TRANSFER/etc.)',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created and processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Transaction created successfully',
        },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'create' },
            item: { type: 'object', description: 'Transaction object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Product or warehouse not found' })
  async createTransaction(@Body() createDto: CreateTransactionDto) {
    try {
      const transaction =
        await this.inventoryService.createTransaction(createDto);
      return created(transaction, 'Transaction created successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'TRANSACTION_CREATE_ERROR',
          err.message || 'Failed to create transaction',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Adjust stock level (inventory count adjustment)' })
  @ApiResponse({
    status: 201,
    description: 'Stock adjusted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Product or warehouse not found' })
  async adjustStock(@Body() adjustmentDto: StockAdjustmentDto) {
    try {
      const stock = await this.inventoryService.adjustStock(adjustmentDto);
      return ok(stock, 'Stock adjusted successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('ADJUSTMENT_ERROR', err.message || 'Failed to adjust stock'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stock/transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({
    status: 201,
    description: 'Stock transfer initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Product or warehouse not found' })
  async transferStock(@Body() transferDto: TransferStockDto) {
    try {
      const transaction =
        await this.inventoryService.transferStock(transferDto);
      return created(transaction, 'Stock transfer completed successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('TRANSFER_ERROR', err.message || 'Failed to transfer stock'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history with filters' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: InventoryTransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'ISO 8601 date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'ISO 8601 date',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
  })
  async getTransactionHistory(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('type') type?: InventoryTransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const filter: any = {
        productId,
        warehouseId,
        organizationId,
        type,
        status,
      };

      if (startDate) {
        filter.startDate = new Date(startDate);
      }
      if (endDate) {
        filter.endDate = new Date(endDate);
      }

      const result = await this.inventoryService.getTransactionHistory(filter, {
        page,
        limit,
      });

      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error(
          'TRANSACTION_FETCH_ERROR',
          err.message || 'Failed to fetch transaction history',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('warehouses/:warehouseId/stock/summary')
  @ApiOperation({ summary: 'Get stock summary for a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock summary retrieved successfully',
  })
  async getWarehouseStockSummary(
    @Param('warehouseId') warehouseId: string,
  ) {
    try {
      const summary =
        await this.inventoryService.getWarehouseStockSummary(warehouseId);
      return ok(summary, 'Stock summary retrieved');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'SUMMARY_FETCH_ERROR',
          err.message || 'Failed to fetch stock summary',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('locations/:binId/stock')
  @ApiOperation({ summary: 'Get stock items in a specific bin/location' })
  @ApiParam({ name: 'binId', description: 'Bin ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Location stock retrieved successfully',
  })
  async getStockByLocation(
    @Param('binId') binId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getStockByLocation(binId, {
        page,
        limit,
      });
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'STOCK_FETCH_ERROR',
          err.message || 'Failed to fetch location stock',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('skus/:skuId/stock')
  @ApiOperation({ summary: 'Get stock for a specific SKU across warehouses' })
  @ApiParam({ name: 'skuId', description: 'Product/SKU ID' })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'SKU stock retrieved successfully',
  })
  async getStockBySku(
    @Param('skuId') skuId: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getStockBySku(skuId, {
        warehouseId,
        page,
        limit,
      });
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'STOCK_FETCH_ERROR',
          err.message || 'Failed to fetch SKU stock',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('skus/:skuId/expiry')
  @ApiOperation({ summary: 'Get lots for a SKU sorted by expiry' })
  @ApiParam({ name: 'skuId', description: 'Product/SKU ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'SKU expiry lots retrieved successfully',
  })
  async getSkuExpiryLots(
    @Param('skuId') skuId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.inventoryService.getSkuExpiryLots(skuId, {
        page,
        limit,
      });
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error(
          'EXPIRY_FETCH_ERROR',
          err.message || 'Failed to fetch expiry lots',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
