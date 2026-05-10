import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import Redis from 'ioredis';
import type { RedisModuleOptions } from './interfaces/redis-options.interface';
import { REDIS_OPTIONS } from './tokens/redis.tokens';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    @Optional()
    @Inject(REDIS_OPTIONS)
    private readonly options: RedisModuleOptions = {},
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.options.host ?? process.env.REDIS_HOST ?? '127.0.0.1',
      port: this.options.port ?? Number(process.env.REDIS_PORT ?? 6379),
      username: this.options.username,
      password: this.options.password,
      db: this.options.db,
      keyPrefix: this.options.keyPrefix,
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });

    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = undefined;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.getClient().get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.getClient().set(key, serialized, 'EX', ttlSeconds);
      return;
    }

    await this.getClient().set(key, serialized);
  }

  async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  async exists(key: string): Promise<boolean> {
    const exists = await this.getClient().exists(key);
    return exists === 1;
  }

  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.getClient().set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const client = this.getClient();
    const value = await client.incr(key);

    if (ttlSeconds && value === 1) {
      await client.expire(key, ttlSeconds);
    }

    return value;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const currentPromise = this.inflight.get(key) as Promise<T> | undefined;
    if (currentPromise) {
      return currentPromise;
    }

    const promise = (async () => {
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      return value;
    })();

    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const client = this.getClient();
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  }

  private getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized. Did you import RedisModule.forRoot()?');
    }

    return this.client;
  }
}
