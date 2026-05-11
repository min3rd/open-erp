import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs: number;
  private readonly authLimit: number;
  private readonly globalLimit: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly configService: ConfigService) {
    this.windowMs = this.configService.get<number>(
      'RATE_LIMIT_WINDOW_MS',
      60_000,
    );
    this.authLimit = this.configService.get<number>(
      'RATE_LIMIT_AUTH_LIMIT',
      10,
    );
    this.globalLimit = this.configService.get<number>(
      'RATE_LIMIT_GLOBAL_LIMIT',
      100,
    );
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.buildKey(req);
    const limit = this.resolveLimit(req.path);
    const now = Date.now();

    const current = this.buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + this.windowMs }
        : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    const resetInSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );

    res.setHeader('x-ratelimit-limit', String(limit));
    res.setHeader('x-ratelimit-remaining', String(remaining));
    res.setHeader(
      'x-ratelimit-reset',
      String(Math.floor(bucket.resetAt / 1000)),
    );

    if (bucket.count > limit) {
      res.setHeader('retry-after', String(resetInSeconds));
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: {
            key: 'error.rate_limit.exceeded',
            data: {
              retryAfterSeconds: resetInSeconds,
              limit,
              windowMs: this.windowMs,
            },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.buckets.size > 10_000) {
      this.cleanup(now);
    }

    next();
  }

  private resolveLimit(path: string): number {
    return path.startsWith('/api/v1/auth') ? this.authLimit : this.globalLimit;
  }

  private buildKey(req: Request): string {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      'unknown';

    const scope = req.path.startsWith('/api/v1/auth') ? 'auth' : 'global';
    return `${scope}:${ip}`;
  }

  private cleanup(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
