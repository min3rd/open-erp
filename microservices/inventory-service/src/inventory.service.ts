import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

interface InventoryItem {
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
}

@Injectable()
export class InventoryService implements OnModuleInit {
  private inventory: Map<string, InventoryItem> = new Map();

  constructor(
    private readonly rabbitMQClient: RabbitMQClient,
    private readonly loggerService: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    // Initialize some sample inventory
    this.initializeSampleInventory();
  }

  async onModuleInit() {
    // Start consuming order events
    await this.startOrderEventConsumer();
  }

  private initializeSampleInventory() {
    const products = ['PROD001', 'PROD002', 'PROD003'];
    products.forEach(productId => {
      this.inventory.set(productId, {
        productId,
        quantity: 100,
        reserved: 0,
        available: 100,
        lastUpdated: new Date().toISOString(),
      });
    });
  }

  private async startOrderEventConsumer() {
    await this.rabbitMQClient.consume(
      'inventory.order-events.queue',
      async (content, message, ack, nack, reject) => {
        try {
          this.loggerService.log('Received order event', {
            orderId: content.orderId,
            items: content.items,
          });

          this.metricsService.incrementCounter('inventory_order_events_received_total');

          // Process the order - reserve inventory
          const startTime = Date.now();
          await this.processOrder(content);
          const duration = (Date.now() - startTime) / 1000;

          this.metricsService.observeHistogram('inventory_order_processing_duration_seconds', duration);
          this.metricsService.incrementCounter('inventory_order_events_processed_total');

          this.loggerService.log('Order processed successfully', {
            orderId: content.orderId,
            duration,
          });

          // Acknowledge the message
          ack();
        } catch (error: any) {
          this.loggerService.error('Error processing order event', error, {
            orderId: content.orderId,
          });

          this.metricsService.incrementCounter('inventory_order_events_failed_total');

          // Nack the message to retry
          nack(false);
        }
      }
    );

    this.loggerService.log('Started consuming order events');
  }

  private async processOrder(orderData: any) {
    const { orderId, items } = orderData;

    for (const item of items) {
      const inventoryItem = this.inventory.get(item.productId);

      if (!inventoryItem) {
        this.loggerService.warn('Product not found in inventory', {
          productId: item.productId,
          orderId,
        });
        throw new Error(`Product ${item.productId} not found in inventory`);
      }

      if (inventoryItem.available < item.quantity) {
        this.loggerService.warn('Insufficient inventory', {
          productId: item.productId,
          requested: item.quantity,
          available: inventoryItem.available,
          orderId,
        });
        throw new Error(`Insufficient inventory for product ${item.productId}`);
      }

      // Reserve inventory
      inventoryItem.reserved += item.quantity;
      inventoryItem.available -= item.quantity;
      inventoryItem.lastUpdated = new Date().toISOString();

      this.inventory.set(item.productId, inventoryItem);

      this.loggerService.log('Inventory reserved', {
        productId: item.productId,
        quantity: item.quantity,
        available: inventoryItem.available,
        orderId,
      });
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async getInventory(productId: string): Promise<InventoryItem> {
    const item = this.inventory.get(productId);
    
    if (!item) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return item;
  }

  async listInventory(): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values());
  }
}
