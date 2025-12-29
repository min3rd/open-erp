import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';

export class CreateOrderDto {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly metricsService: MetricsService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    this.metricsService.incrementCounter('order_create_attempts_total');
    this.loggerService.log('Create order attempt', { userId: createOrderDto.userId });
    
    const result = await this.orderService.createOrder(createOrderDto);
    
    this.metricsService.incrementCounter('order_create_success_total');
    return result;
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    this.metricsService.incrementCounter('order_get_requests_total');
    return this.orderService.getOrder(id);
  }

  @Get()
  async listOrders() {
    this.metricsService.incrementCounter('order_list_requests_total');
    return this.orderService.listOrders();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'order-service',
    };
  }

  @Get('metrics')
  async metrics() {
    return this.metricsService.getMetrics();
  }
}
