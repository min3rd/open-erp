import { Injectable, NotFoundException } from '@nestjs/common';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';
import { LoggerService } from './logger.service';

interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

@Injectable()
export class OrderService {
  private orders: Map<string, Order> = new Map();

  constructor(
    private readonly rabbitMQClient: RabbitMQClient,
    private readonly loggerService: LoggerService,
  ) {}

  async createOrder(createOrderDto: any): Promise<Order> {
    const order: Order = {
      id: this.generateOrderId(),
      userId: createOrderDto.userId,
      items: createOrderDto.items,
      totalAmount: createOrderDto.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.orders.set(order.id, order);

    // Publish order created event - this will be consumed by inventory service
    await this.rabbitMQClient.publish(
      'order.events',
      'order.created',
      {
        orderId: order.id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        timestamp: order.createdAt,
      },
      {
        persistent: true,
        messageId: `order_${order.id}`,
      }
    );

    this.loggerService.log('Order created and event published', {
      orderId: order.id,
      userId: order.userId,
    });

    return order;
  }

  async getOrder(id: string): Promise<Order> {
    const order = this.orders.get(id);
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const order = this.orders.get(orderId);
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    order.status = status;
    this.orders.set(orderId, order);

    // Publish order status updated event
    await this.rabbitMQClient.publish(
      'order.events',
      'order.status.updated',
      {
        orderId: order.id,
        status: order.status,
        timestamp: new Date().toISOString(),
      }
    );

    this.loggerService.log('Order status updated', {
      orderId: order.id,
      status: order.status,
    });

    return order;
  }

  private generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
