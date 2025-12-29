export interface RabbitMQConfig {
  url: string;
  user: string;
  password: string;
  vhost?: string;
  heartbeat?: number;
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableTLS?: boolean;
}

export interface MessageOptions {
  persistent?: boolean;
  correlationId?: string;
  replyTo?: string;
  expiration?: string;
  messageId?: string;
  timestamp?: number;
  headers?: Record<string, any>;
}

export interface ExchangeConfig {
  name: string;
  type: 'direct' | 'topic' | 'fanout' | 'headers';
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  arguments?: Record<string, any>;
}

export interface QueueConfig {
  name: string;
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, any>;
}

export interface BindingConfig {
  queue: string;
  exchange: string;
  routingKey?: string;
  arguments?: Record<string, any>;
}

export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  consumerTag?: string;
}

export type MessageHandler = (
  content: any,
  message: any,
  ack: () => void,
  nack: (requeue?: boolean) => void,
  reject: (requeue?: boolean) => void
) => Promise<void> | void;
