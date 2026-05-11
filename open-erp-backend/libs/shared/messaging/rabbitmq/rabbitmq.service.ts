import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Channel, ConsumeMessage, Message, connect, Options } from 'amqplib';
import type { ChannelModel } from 'amqplib';
import { randomUUID } from 'node:crypto';
import { RABBITMQ_EXCHANGES } from './constants/exchanges';
import { ErpMessage } from './interfaces/erp-message.interface';
import type { RabbitmqModuleOptions } from './interfaces/rabbitmq-options.interface';
import { RABBITMQ_OPTIONS } from './tokens/rabbitmq.tokens';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  constructor(
    @Inject(RABBITMQ_OPTIONS)
    private readonly options: RabbitmqModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = await connect(this.options.uri);
    const channel = await connection.createChannel();

    this.connection = connection;
    this.channel = channel;

    if (this.options.prefetch) {
      await channel.prefetch(this.options.prefetch);
    }

    await this.assertBaseExchanges();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = undefined;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }

  async publish<T>(
    exchange: string,
    routingKey: string,
    payload: T,
    headers?: Record<string, unknown>,
  ): Promise<void> {
    const channel = this.getChannel();
    const message = Buffer.from(JSON.stringify(payload));
    const publishOptions: Options.Publish = {
      contentType: 'application/json',
      persistent: true,
      headers,
    };

    channel.publish(exchange, routingKey, message, publishOptions);
  }

  async publishEvent<T>(
    eventType: string,
    tenantId: string,
    userId: string,
    payload: T,
    metadata?: ErpMessage<T>['metadata'],
  ): Promise<void> {
    const message: ErpMessage<T> = {
      eventId: randomUUID(),
      eventType,
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      version: 1,
      payload,
      metadata: {
        source: this.options.serviceName,
        ...metadata,
      },
    };

    await this.publish(RABBITMQ_EXCHANGES.TOPIC, eventType, message);
  }

  async subscribe<T>(
    queue: string,
    handler: (msg: ErpMessage<T>) => Promise<void>,
    routingKey = '#',
    exchange = RABBITMQ_EXCHANGES.TOPIC,
  ): Promise<void> {
    const channel = this.getChannel();
    const policy = this.options.retryPolicy ?? {};
    const maxRetries = policy.maxRetries ?? 3;
    const retryDelays = policy.retryDelays ?? [1000, 5000, 25000];

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
        'x-dead-letter-routing-key': `dlq.${routingKey}`,
      },
    });
    await channel.bindQueue(queue, exchange, routingKey);

    await channel.consume(queue, async (raw) => {
      if (!raw) {
        return;
      }

      await this.handleMessage(
        raw,
        handler,
        exchange,
        routingKey,
        maxRetries,
        retryDelays,
      );
    });
  }

  private async handleMessage<T>(
    rawMessage: ConsumeMessage,
    handler: (msg: ErpMessage<T>) => Promise<void>,
    exchange: string,
    routingKey: string,
    maxRetries: number,
    retryDelays: number[],
  ): Promise<void> {
    const channel = this.getChannel();

    try {
      const message = JSON.parse(
        rawMessage.content.toString(),
      ) as ErpMessage<T>;
      await handler(message);
      channel.ack(rawMessage);
    } catch (error) {
      const currentRetry = this.extractRetryCount(rawMessage);
      if (currentRetry < maxRetries) {
        const delay =
          retryDelays[currentRetry] ??
          retryDelays[retryDelays.length - 1] ??
          1000;
        await this.requeueWithDelay(
          rawMessage,
          exchange,
          routingKey,
          currentRetry + 1,
          delay,
        );
      } else {
        channel.publish(
          RABBITMQ_EXCHANGES.DEAD_LETTER,
          `dlq.${routingKey}`,
          rawMessage.content,
          {
            headers: {
              ...rawMessage.properties.headers,
              'x-retry-count': currentRetry,
            },
          },
        );
        this.logger.error(
          `Message moved to DLQ after ${currentRetry} retries for ${routingKey}`,
        );
      }

      channel.ack(rawMessage);
      this.logger.warn(
        `Message processing failed for ${routingKey}: ${(error as Error).message}`,
      );
    }
  }

  private extractRetryCount(rawMessage: Message): number {
    const headers = rawMessage.properties.headers as
      | Record<string, unknown>
      | undefined;
    const value = headers?.['x-retry-count'];
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  private async requeueWithDelay(
    rawMessage: ConsumeMessage,
    exchange: string,
    routingKey: string,
    retryCount: number,
    delayMs: number,
  ): Promise<void> {
    const channel = this.getChannel();

    channel.publish(exchange, routingKey, rawMessage.content, {
      expiration: String(delayMs),
      headers: {
        ...rawMessage.properties.headers,
        'x-retry-count': retryCount,
      },
      persistent: true,
      contentType: 'application/json',
    });
  }

  private async assertBaseExchanges(): Promise<void> {
    const channel = this.getChannel();
    await channel.assertExchange(RABBITMQ_EXCHANGES.DIRECT, 'direct', {
      durable: true,
    });
    await channel.assertExchange(RABBITMQ_EXCHANGES.TOPIC, 'topic', {
      durable: true,
    });
    await channel.assertExchange(RABBITMQ_EXCHANGES.FANOUT, 'fanout', {
      durable: true,
    });
    await channel.assertExchange(RABBITMQ_EXCHANGES.DEAD_LETTER, 'direct', {
      durable: true,
    });
  }

  private getChannel(): Channel {
    if (!this.channel) {
      throw new Error(
        'RabbitMQ channel is not initialized. Did you import RabbitmqModule.forRoot()?',
      );
    }

    return this.channel;
  }
}
