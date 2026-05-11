import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

type DependencyStatus = 'ok' | 'not-configured' | 'unreachable';

@Injectable()
export class HealthDependencyProbeService {
  private readonly logger = new Logger(HealthDependencyProbeService.name);

  async probeAll(): Promise<Record<string, DependencyStatus>> {
    const [redis, authService, tenantService] = await Promise.all([
      this.probeRedis(process.env.REDIS_URL),
      this.probeHttpDependency(process.env.AUTH_SERVICE_URL),
      this.probeHttpDependency(process.env.TENANT_SERVICE_URL),
    ]);

    return {
      redis,
      authService,
      tenantService,
    };
  }

  private async probeRedis(redisUrl?: string): Promise<DependencyStatus> {
    if (!redisUrl) {
      return 'not-configured';
    }

    const client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG' ? 'ok' : 'unreachable';
    } catch {
      this.logger.warn('Redis health probe failed');
      return 'unreachable';
    } finally {
      await client.quit().catch(() => undefined);
      client.disconnect();
    }
  }

  private async probeHttpDependency(baseUrl?: string): Promise<DependencyStatus> {
    if (!baseUrl) {
      return 'not-configured';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    try {
      const normalizedBase = baseUrl.replace(/\/+$/, '');
      const response = await fetch(`${normalizedBase}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      return response.ok ? 'ok' : 'unreachable';
    } catch {
      this.logger.warn(`HTTP dependency health probe failed: ${baseUrl}`);
      return 'unreachable';
    } finally {
      clearTimeout(timeout);
    }
  }
}
