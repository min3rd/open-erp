import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { RabbitMQService } from './rabbitmq.service';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const env: Record<string, string> = {
                RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
              };
              return env[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(async () => {
    try {
      await service.onModuleDestroy();
    } catch {
      // Ignore errors during test cleanup
    }
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ successfully', async () => {
      const mockChannel = {
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
      };

      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();

      expect(amqplib.connect).toHaveBeenCalledWith(
        'amqp://guest:guest@localhost:5672',
      );
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'openErp.events',
        'topic',
        { durable: true },
      );
    });

    it('should use default RabbitMQ URL if not configured', async () => {
      const mockChannel = {
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
      };

      (configService.get as jest.Mock).mockReturnValue(null);
      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();

      expect(amqplib.connect).toHaveBeenCalledWith(
        'amqp://guest:guest@localhost:5672',
      );
    });

    it('should handle connection failure gracefully', async () => {
      const error = new Error('Connection refused');
      (amqplib.connect as jest.Mock).mockRejectedValue(error);

      await service.onModuleInit();

      expect(amqplib.connect).toHaveBeenCalled();
      // Service should set channel and connection to null on failure
      expect((service as any).channel).toBeNull();
      expect((service as any).connection).toBeNull();
    });
  });

  describe('publish', () => {
    it('should publish message successfully when channel exists', async () => {
      const mockChannel = {
        publish: jest.fn(),
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
      };

      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();

      const payload = { test: 'data' };
      await service.publish('user.created', payload);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'openErp.events',
        'user.created',
        Buffer.from(JSON.stringify(payload)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );
    });

    it('should not publish when channel is null', async () => {
      // Don't initialize, so channel stays null
      const payload = { test: 'data' };
      await service.publish('user.created', payload);

      // Should return early without error
      expect((service as any).channel).toBeNull();
    });

    it('should handle publish errors gracefully', async () => {
      const mockChannel = {
        publish: jest.fn().mockImplementation(() => {
          throw new Error('Publish failed');
        }),
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
      };

      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();

      const payload = { test: 'data' };
      await service.publish('user.created', payload);

      // Should not throw, just warn
      expect((service as any).channel).toBeDefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection on destroy', async () => {
      const mockChannel = {
        close: jest.fn().mockResolvedValue(undefined),
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle errors during channel close', async () => {
      const mockChannel = {
        close: jest.fn().mockRejectedValue(new Error('Close failed')),
        assertExchange: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle null channel and connection safely', async () => {
      // Don't initialize, channel and connection are null
      await service.onModuleDestroy();

      expect((service as any).channel).toBeNull();
      expect((service as any).connection).toBeNull();
    });
  });
});
