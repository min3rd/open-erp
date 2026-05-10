import { RedisService } from '../../libs/shared/messaging/redis/redis.service';

describe('RedisService', () => {
  function createService() {
    const service = new RedisService();
    const mockClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      scan: jest.fn(),
    };

    (service as any).client = mockClient;

    return { service, mockClient };
  }

  it('calls factory once for concurrent getOrSet with the same key', async () => {
    const { service, mockClient } = createService();
    mockClient.get.mockResolvedValue(null);
    mockClient.set.mockResolvedValue('OK');

    const factory = jest.fn(async () => ({ value: 'computed' }));

    const [first, second] = await Promise.all([
      service.getOrSet('cache:key', factory, 30),
      service.getOrSet('cache:key', factory, 30),
    ]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(mockClient.set).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ value: 'computed' });
    expect(second).toEqual({ value: 'computed' });
  });

  it('returns null after delete', async () => {
    const { service, mockClient } = createService();
    mockClient.del.mockResolvedValue(1);
    mockClient.get.mockResolvedValue(null);

    await service.del('cache:key');
    const value = await service.get('cache:key');

    expect(mockClient.del).toHaveBeenCalledWith('cache:key');
    expect(value).toBeNull();
  });
});
