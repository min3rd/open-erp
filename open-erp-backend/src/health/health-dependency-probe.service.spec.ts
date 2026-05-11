import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { HealthDependencyProbeService } from './health-dependency-probe.service';

jest.mock('ioredis');

describe('HealthDependencyProbeService', () => {
  let service: HealthDependencyProbeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthDependencyProbeService],
    }).compile();

    service = module.get<HealthDependencyProbeService>(
      HealthDependencyProbeService,
    );

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    // Clear environment variables
    delete process.env.REDIS_URL;
    delete process.env.AUTH_SERVICE_URL;
    delete process.env.TENANT_SERVICE_URL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('probeAll', () => {
    it('should probe all dependencies in parallel', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
      process.env.TENANT_SERVICE_URL = 'http://localhost:3002';

      const mockRedisClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };

      (Redis as jest.Mock).mockReturnValue(mockRedisClient);

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

      const result = await service.probeAll();

      expect(result).toEqual({
        redis: 'ok',
        authService: 'ok',
        tenantService: 'ok',
      });
    });

    it('should return not-configured for missing dependencies', async () => {
      delete process.env.REDIS_URL;
      delete process.env.AUTH_SERVICE_URL;
      delete process.env.TENANT_SERVICE_URL;

      const result = await service.probeAll();

      expect(result).toEqual({
        redis: 'not-configured',
        authService: 'not-configured',
        tenantService: 'not-configured',
      });
    });
  });

  describe('probeRedis', () => {
    it('should return "ok" when Redis is reachable', async () => {
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };

      (Redis as jest.Mock).mockReturnValue(mockClient);

      const result = await (service as any).probeRedis('redis://localhost:6379');

      expect(result).toBe('ok');
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.ping).toHaveBeenCalled();
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should return "not-configured" when Redis URL is not provided', async () => {
      const result = await (service as any).probeRedis(undefined);

      expect(result).toBe('not-configured');
    });

    it('should return "unreachable" when Redis connection fails', async () => {
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };

      (Redis as jest.Mock).mockReturnValue(mockClient);

      const result = await (service as any).probeRedis('redis://localhost:6379');

      expect(result).toBe('unreachable');
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should return "unreachable" when ping response is not PONG', async () => {
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('ERROR'),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };

      (Redis as jest.Mock).mockReturnValue(mockClient);

      const result = await (service as any).probeRedis('redis://localhost:6379');

      expect(result).toBe('unreachable');
    });

    it('should handle quit() errors gracefully', async () => {
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockRejectedValue(new Error('Quit failed')),
        disconnect: jest.fn(),
      };

      (Redis as jest.Mock).mockReturnValue(mockClient);

      const result = await (service as any).probeRedis('redis://localhost:6379');

      expect(result).toBe('ok');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('probeHttpDependency', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should return "ok" when HTTP service responds successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const result = await (service as any).probeHttpDependency(
        'http://localhost:3001',
      );

      expect(result).toBe('ok');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal),
      });
    });

    it('should return "not-configured" when URL is not provided', async () => {
      const result = await (service as any).probeHttpDependency(undefined);

      expect(result).toBe('not-configured');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return "unreachable" when HTTP service responds with error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const result = await (service as any).probeHttpDependency(
        'http://localhost:3001',
      );

      expect(result).toBe('unreachable');
    });

    it('should return "unreachable" when HTTP request fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await (service as any).probeHttpDependency(
        'http://localhost:3001',
      );

      expect(result).toBe('unreachable');
    });

    it('should return "unreachable" when request times out', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        const error = new Error('Abort');
        (error as any).name = 'AbortError';
        throw error;
      });

      const result = await (service as any).probeHttpDependency(
        'http://localhost:3001',
      );

      expect(result).toBe('unreachable');
    });

    it('should normalize URL by removing trailing slashes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await (service as any).probeHttpDependency('http://localhost:3001///');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal),
      });
    });

    it('should clear timeout on success', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await (service as any).probeHttpDependency('http://localhost:3001');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout on error', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await (service as any).probeHttpDependency('http://localhost:3001');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
