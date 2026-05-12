import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from '../../common/services/rabbitmq.service';
import { UsersService } from '../users.service';
import { TenantCreatedHandler } from './tenant.handler';

describe('TenantCreatedHandler', () => {
  let handler: TenantCreatedHandler;
  let subscribedCallback: ((payload: any) => Promise<void>) | undefined;

  const rabbitMQService = {
    subscribe: jest.fn().mockImplementation((_event, callback) => {
      subscribedCallback = callback;
      return Promise.resolve();
    }),
  };

  const usersService = {
    bootstrapTenantAdmin: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    subscribedCallback = undefined;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantCreatedHandler,
        { provide: RabbitMQService, useValue: rabbitMQService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    handler = module.get<TenantCreatedHandler>(TenantCreatedHandler);
    jest.clearAllMocks();
    // Re-register mock after clearAllMocks
    rabbitMQService.subscribe.mockImplementation((_event: string, callback: (payload: any) => Promise<void>) => {
      subscribedCallback = callback;
      return Promise.resolve();
    });
    usersService.bootstrapTenantAdmin.mockResolvedValue({ success: true });
  });

  it('subscribes to tenant.created on module init', async () => {
    await handler.onModuleInit();

    expect(rabbitMQService.subscribe).toHaveBeenCalledWith(
      'tenant.created',
      expect.any(Function),
    );
  });

  it('calls bootstrapTenantAdmin when valid payload received', async () => {
    await handler.onModuleInit();
    expect(subscribedCallback).toBeDefined();

    await subscribedCallback!({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
      plan: 'TRIAL',
    });

    expect(usersService.bootstrapTenantAdmin).toHaveBeenCalledWith({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
      plan: 'TRIAL',
    });
  });

  it('skips bootstrapTenantAdmin when payload is missing tenantId', async () => {
    await handler.onModuleInit();
    expect(subscribedCallback).toBeDefined();

    await subscribedCallback!({ adminEmail: 'admin@acme.com' });

    expect(usersService.bootstrapTenantAdmin).not.toHaveBeenCalled();
  });

  it('skips bootstrapTenantAdmin when payload is missing adminEmail', async () => {
    await handler.onModuleInit();
    expect(subscribedCallback).toBeDefined();

    await subscribedCallback!({ tenantId: '64b000000000000000000001' });

    expect(usersService.bootstrapTenantAdmin).not.toHaveBeenCalled();
  });

  it('skips bootstrapTenantAdmin when payload is null', async () => {
    await handler.onModuleInit();
    expect(subscribedCallback).toBeDefined();

    await subscribedCallback!(null);

    expect(usersService.bootstrapTenantAdmin).not.toHaveBeenCalled();
  });

  it('calls bootstrapTenantAdmin without plan when plan not provided', async () => {
    await handler.onModuleInit();
    expect(subscribedCallback).toBeDefined();

    await subscribedCallback!({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
    });

    expect(usersService.bootstrapTenantAdmin).toHaveBeenCalledWith({
      tenantId: '64b000000000000000000001',
      adminEmail: 'admin@acme.com',
      plan: undefined,
    });
  });
});
