import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const rabbitUrl =
      this.configService.get<string>('RABBITMQ_URL') ??
      'amqp://guest:guest@localhost:5672';

    try {
      this.connection = await connect(rabbitUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('openErp.events', 'topic', {
        durable: true,
      });
    } catch (error) {
      this.connection = null;
      this.channel = null;
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`RabbitMQ unavailable at startup: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close().catch(() => undefined);
      this.connection = null;
    }
  }

  async publish(routingKey: string, payload: object): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      this.channel.publish(
        'openErp.events',
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`Failed to publish ${routingKey}: ${message}`);
    }
  }

  async subscribe(
    routingKey: string,
    handler: (payload: Record<string, unknown>) => Promise<void> | void,
  ): Promise<void> {
    if (!this.channel) {
      return;
    }

    const queueName = `openErp.${routingKey.replace(/\./g, '_')}.${randomUUID()}`;
    await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: true,
    });
    await this.channel.bindQueue(queueName, 'openErp.events', routingKey);

    await this.channel.consume(
      queueName,
      async (message: ConsumeMessage | null) => {
        if (!message) {
          return;
        }

        try {
          const payload = JSON.parse(message.content.toString()) as Record<
            string,
            unknown
          >;
          await handler(payload);
          this.channel?.ack(message);
        } catch (error) {
          this.channel?.nack(message, false, false);
          const messageText =
            error instanceof Error ? error.message : 'unknown';
          this.logger.warn(`Failed to handle ${routingKey}: ${messageText}`);
        }
      },
    );
  }
}
