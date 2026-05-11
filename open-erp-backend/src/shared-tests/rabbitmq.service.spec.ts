import { ConsumeMessage } from 'amqplib';
import { RabbitmqService } from '../../libs/shared/messaging/rabbitmq/rabbitmq.service';
import { RABBITMQ_EXCHANGES } from '../../libs/shared/messaging/rabbitmq/constants/exchanges';

describe('RabbitmqService', () => {
  function createService() {
    const service = new RabbitmqService({
      uri: 'amqp://localhost:5672',
      serviceName: 'test-service',
      retryPolicy: {
        maxRetries: 3,
        retryDelays: [1000, 5000, 25000],
      },
    });

    const channel = {
      publish: jest.fn(),
      ack: jest.fn(),
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
      prefetch: jest.fn().mockResolvedValue(undefined),
    };

    (service as any).channel = channel;

    return { service, channel };
  }

  function createRawMessage(
    headers: Record<string, unknown> = {},
  ): ConsumeMessage {
    return {
      content: Buffer.from(
        JSON.stringify({
          eventId: 'event-1',
          eventType: 'tenant.created',
          tenantId: 'tenant-1',
          userId: 'user-1',
          timestamp: new Date().toISOString(),
          version: 1,
          payload: { id: 'tenant-1' },
        }),
      ),
      fields: {} as ConsumeMessage['fields'],
      properties: {
        headers,
      } as ConsumeMessage['properties'],
    } as ConsumeMessage;
  }

  it('asserts all base exchanges', async () => {
    const { service, channel } = createService();

    await (service as any).assertBaseExchanges();

    expect(channel.assertExchange).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.DIRECT,
      'direct',
      { durable: true },
    );
    expect(channel.assertExchange).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.TOPIC,
      'topic',
      { durable: true },
    );
    expect(channel.assertExchange).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.FANOUT,
      'fanout',
      { durable: true },
    );
    expect(channel.assertExchange).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.DEAD_LETTER,
      'direct',
      { durable: true },
    );
  });

  it('publishes event envelope to topic exchange', async () => {
    const { service } = createService();
    const publishSpy = jest.spyOn(service, 'publish').mockResolvedValue();

    await service.publishEvent('user.created', 'tenant-1', 'user-1', {
      email: 'a@b.c',
    });

    expect(publishSpy).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, payload] = publishSpy.mock.calls[0];
    expect(exchange).toBe(RABBITMQ_EXCHANGES.TOPIC);
    expect(routingKey).toBe('user.created');
    expect(payload).toMatchObject({
      eventType: 'user.created',
      tenantId: 'tenant-1',
      userId: 'user-1',
      version: 1,
      metadata: {
        source: 'test-service',
      },
    });
  });

  it('requeues message with retry header when handler fails before max retries', async () => {
    const { service, channel } = createService();
    const rawMessage = createRawMessage({ 'x-retry-count': 1 });

    await (service as any).handleMessage(
      rawMessage,
      jest.fn().mockRejectedValue(new Error('handler failed')),
      RABBITMQ_EXCHANGES.TOPIC,
      'tenant.created',
      3,
      [1000, 5000, 25000],
    );

    expect(channel.publish).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.TOPIC,
      'tenant.created',
      rawMessage.content,
      expect.objectContaining({
        expiration: '5000',
        headers: expect.objectContaining({
          'x-retry-count': 2,
        }),
      }),
    );
    expect(channel.ack).toHaveBeenCalledWith(rawMessage);
  });

  it('moves message to DLQ when retry is exhausted', async () => {
    const { service, channel } = createService();
    const rawMessage = createRawMessage({ 'x-retry-count': 3 });

    await (service as any).handleMessage(
      rawMessage,
      jest.fn().mockRejectedValue(new Error('handler failed again')),
      RABBITMQ_EXCHANGES.TOPIC,
      'tenant.created',
      3,
      [1000, 5000, 25000],
    );

    expect(channel.publish).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGES.DEAD_LETTER,
      'dlq.tenant.created',
      rawMessage.content,
      {
        headers: expect.objectContaining({
          'x-retry-count': 3,
        }),
      },
    );
    expect(channel.ack).toHaveBeenCalledWith(rawMessage);
  });
});
