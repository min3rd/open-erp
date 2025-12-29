import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly metricsService: MetricsService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get(':productId')
  async getInventory(@Param('productId') productId: string) {
    this.metricsService.incrementCounter('inventory_get_requests_total');
    return this.inventoryService.getInventory(productId);
  }

  @Get()
  async listInventory() {
    this.metricsService.incrementCounter('inventory_list_requests_total');
    return this.inventoryService.listInventory();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'inventory-service',
    };
  }

  @Get('metrics')
  async metrics() {
    return this.metricsService.getMetrics();
  }
}
