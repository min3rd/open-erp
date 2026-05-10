import { Injectable, NestMiddleware, TooManyRequestsException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 60_000;
  private readonly authLimit = 10;
  private readonly globalLimit = 100;
  private readonly buckets = new Map<string, Bucket>();

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.buildKey(req);
    const limit = this.resolveLimit(req.path);
    const now = Date.now();

    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + this.windowMs }
      : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    const resetInSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('x-ratelimit-limit', String(limit));
    res.setHeader('x-ratelimit-remaining', String(remaining));
    res.setHeader('x-ratelimit-reset', String(Math.floor(bucket.resetAt / 1000)));

    if (bucket.count > limit) {
      res.setHeader('retry-after', String(resetInSeconds));
      throw new TooManyRequestsException({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      });
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
