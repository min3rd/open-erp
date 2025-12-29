import * as amqp from 'amqplib';
import { createLogger, format, transports, Logger } from 'winston';
import {
  RabbitMQConfig,
  MessageOptions,
  ExchangeConfig,
  QueueConfig,
  BindingConfig,
  ConsumeOptions,
  MessageHandler,
} from './types';

export class RabbitMQClient {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private logger: Logger;
  private config: Required<RabbitMQConfig>;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private processedMessages: Set<string> = new Set();

  constructor(config: RabbitMQConfig) {
    this.config = {
      url: config.url,
      user: config.user,
      password: config.password,
      vhost: config.vhost || '/',
      heartbeat: config.heartbeat || 60,
      prefetchCount: config.prefetchCount || 10,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableTLS: config.enableTLS || false,
    };

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [new transports.Console()],
    });
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      this.logger.info('Connection attempt already in progress');
      return;
    }

    if (this.connection && this.channel) {
      this.logger.info('Already connected to RabbitMQ');
      return;
    }

    this.isConnecting = true;

    try {
      const connectionUrl = this.buildConnectionUrl();
      
      this.logger.info('Connecting to RabbitMQ', {
        url: this.sanitizeUrl(connectionUrl),
      });

      this.connection = await amqp.connect(connectionUrl, {
        heartbeat: this.config.heartbeat,
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', { error: err.message });
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.handleConnectionError();
      });

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(this.config.prefetchCount);

      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error', { error: err.message });
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });

      this.logger.info('Successfully connected to RabbitMQ');
      this.isConnecting = false;
    } catch (error: any) {
      this.isConnecting = false;
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error.message,
      });
      throw error;
    }
  }

  private buildConnectionUrl(): string {
    const protocol = this.config.enableTLS ? 'amqps' : 'amqp';
    const auth = `${this.config.user}:${this.config.password}`;
    const urlObj = new URL(this.config.url);
    return `${protocol}://${auth}@${urlObj.host}${this.config.vhost}`;
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/:[^:@]+@/, ':****@');
  }

  private handleConnectionError(): void {
    this.connection = null;
    this.channel = null;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(async () => {
      this.logger.info('Attempting to reconnect to RabbitMQ');
      try {
        await this.connect();
      } catch (error: any) {
        this.logger.error('Reconnection failed', { error: error.message });
      }
    }, this.config.retryDelay);
  }

  async assertExchange(config: ExchangeConfig): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.assertExchange(
      config.name,
      config.type,
      {
        durable: config.durable !== false,
        autoDelete: config.autoDelete || false,
        internal: config.internal || false,
        arguments: config.arguments || {},
      }
    );

    this.logger.info('Exchange asserted', { exchange: config.name });
  }

  async assertQueue(config: QueueConfig): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.assertQueue(config.name, {
      durable: config.durable !== false,
      exclusive: config.exclusive || false,
      autoDelete: config.autoDelete || false,
      arguments: config.arguments || {},
    });

    this.logger.info('Queue asserted', { queue: config.name });
  }

  async bindQueue(config: BindingConfig): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.bindQueue(
      config.queue,
      config.exchange,
      config.routingKey || '',
      config.arguments || {}
    );

    this.logger.info('Queue bound to exchange', {
      queue: config.queue,
      exchange: config.exchange,
      routingKey: config.routingKey,
    });
  }

  async publish(
    exchange: string,
    routingKey: string,
    content: any,
    options?: MessageOptions
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const messageId = options?.messageId || this.generateMessageId();
    const messageContent = Buffer.from(JSON.stringify(content));

    const publishOptions: amqp.Options.Publish = {
      persistent: options?.persistent !== false,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      expiration: options?.expiration,
      messageId,
      timestamp: options?.timestamp || Date.now(),
      headers: {
        ...options?.headers,
        'x-retry-count': 0,
      },
    };

    let attempt = 0;
    while (attempt < this.config.retryAttempts) {
      try {
        const result = this.channel.publish(
          exchange,
          routingKey,
          messageContent,
          publishOptions
        );

        this.logger.info('Message published', {
          exchange,
          routingKey,
          messageId,
          attempt: attempt + 1,
        });

        return result;
      } catch (error: any) {
        attempt++;
        this.logger.warn('Failed to publish message', {
          exchange,
          routingKey,
          messageId,
          attempt,
          error: error.message,
        });

        if (attempt >= this.config.retryAttempts) {
          this.logger.error('Max retry attempts reached for publishing', {
            exchange,
            routingKey,
            messageId,
          });
          throw error;
        }

        await this.sleep(this.calculateBackoff(attempt));
      }
    }

    return false;
  }

  async consume(
    queue: string,
    handler: MessageHandler,
    options?: ConsumeOptions
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(
      queue,
      async (message) => {
        if (!message) {
          return;
        }

        const messageId = message.properties.messageId;
        const retryCount = message.properties.headers?.['x-retry-count'] || 0;

        // Idempotency check
        if (messageId && this.processedMessages.has(messageId)) {
          this.logger.warn('Duplicate message detected, skipping', {
            messageId,
            queue,
          });
          this.channel?.ack(message);
          return;
        }

        try {
          const content = JSON.parse(message.content.toString());

          this.logger.info('Processing message', {
            queue,
            messageId,
            retryCount,
          });

          await handler(
            content,
            message,
            () => {
              if (this.channel && message) {
                this.channel.ack(message);
                if (messageId) {
                  this.processedMessages.add(messageId);
                  // Clean up old message IDs periodically
                  this.cleanupProcessedMessages();
                }
                this.logger.info('Message acknowledged', {
                  queue,
                  messageId,
                });
              }
            },
            (requeue = false) => {
              if (this.channel && message) {
                this.channel.nack(message, false, requeue);
                this.logger.info('Message nacked', {
                  queue,
                  messageId,
                  requeue,
                });
              }
            },
            (requeue = false) => {
              if (this.channel && message) {
                this.channel.reject(message, requeue);
                this.logger.info('Message rejected', {
                  queue,
                  messageId,
                  requeue,
                });
              }
            }
          );
        } catch (error: any) {
          this.logger.error('Error processing message', {
            queue,
            messageId,
            retryCount,
            error: error.message,
            stack: error.stack,
          });

          // Retry logic with exponential backoff
          if (retryCount < this.config.retryAttempts) {
            const newRetryCount = retryCount + 1;
            const delay = this.calculateBackoff(newRetryCount);

            this.logger.info('Requeueing message for retry', {
              queue,
              messageId,
              retryCount: newRetryCount,
              delay,
            });

            // Update retry count and republish
            message.properties.headers['x-retry-count'] = newRetryCount;
            this.channel?.nack(message, false, false);
          } else {
            this.logger.error('Max retries exceeded, sending to DLX', {
              queue,
              messageId,
              retryCount,
            });
            this.channel?.nack(message, false, false);
          }
        }
      },
      {
        noAck: options?.noAck || false,
        exclusive: options?.exclusive || false,
        priority: options?.priority,
        consumerTag: options?.consumerTag,
      }
    );

    this.logger.info('Started consuming messages', { queue });
  }

  async sendToQueue(
    queue: string,
    content: any,
    options?: MessageOptions
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const messageId = options?.messageId || this.generateMessageId();
    const messageContent = Buffer.from(JSON.stringify(content));

    const sendOptions: amqp.Options.Publish = {
      persistent: options?.persistent !== false,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      expiration: options?.expiration,
      messageId,
      timestamp: options?.timestamp || Date.now(),
      headers: {
        ...options?.headers,
        'x-retry-count': 0,
      },
    };

    let attempt = 0;
    while (attempt < this.config.retryAttempts) {
      try {
        const result = this.channel.sendToQueue(
          queue,
          messageContent,
          sendOptions
        );

        this.logger.info('Message sent to queue', {
          queue,
          messageId,
          attempt: attempt + 1,
        });

        return result;
      } catch (error: any) {
        attempt++;
        this.logger.warn('Failed to send message to queue', {
          queue,
          messageId,
          attempt,
          error: error.message,
        });

        if (attempt >= this.config.retryAttempts) {
          this.logger.error('Max retry attempts reached for sending', {
            queue,
            messageId,
          });
          throw error;
        }

        await this.sleep(this.calculateBackoff(attempt));
      }
    }

    return false;
  }

  async close(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.logger.info('RabbitMQ connection closed');
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateBackoff(attempt: number): number {
    return Math.min(
      this.config.retryDelay * Math.pow(2, attempt - 1),
      30000
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private cleanupProcessedMessages(): void {
    // Keep only the last 10000 message IDs
    if (this.processedMessages.size > 10000) {
      const toDelete = Array.from(this.processedMessages).slice(0, 5000);
      toDelete.forEach((id) => this.processedMessages.delete(id));
    }
  }

  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}
