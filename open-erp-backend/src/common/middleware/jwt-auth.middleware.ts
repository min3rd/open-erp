import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { JwtPayload, verify } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private redisClient: Redis | null = null;

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const isPublic =
      req.path === '/health' ||
      req.path.startsWith('/api/docs') ||
      req.path.startsWith('/api/v1/auth');

    const authHeader = req.header('authorization') || '';
    const token = this.extractBearer(authHeader);

    if (!token) {
      if (isPublic) {
        next();
        return;
      }

      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing bearer token',
      });
    }

    if (await this.isBlacklisted(token)) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Token is blacklisted',
      });
    }

    try {
      const payload = this.verifyToken(token);
      req.user = payload as Express.User;
      next();
    } catch {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
      });
    }
  }

  private extractBearer(authHeader: string): string | null {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token.trim();
  }

  private verifyToken(token: string): JwtPayload {
    const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

    const payload = publicKey
      ? verify(token, publicKey, { algorithms: ['RS256'] })
      : verify(token, secret, { algorithms: ['HS256'] });

    return payload as JwtPayload;
  }

  private async isBlacklisted(token: string): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return false;
    }

    if (!this.redisClient) {
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      this.redisClient.connect().catch(() => {
        this.redisClient = null;
      });

      return false;
    }

    const cachedToken = await this.redisClient
      .get(`jwt:blacklist:${token}`)
      .catch(() => null);

    return Boolean(cachedToken);
  }
}
