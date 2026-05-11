import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtPayload, verify } from 'jsonwebtoken';
import type { Request } from 'express';
import { resolveJwtRuntimeConfig } from '../../auth/auth-runtime.config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private redisClient: Redis | null = null;
  private jwtFallbackWarningLogged = false;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.header('authorization') ?? '';
    const token = this.extractBearer(authHeader);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing bearer token',
      });
    }

    try {
      const payload = this.verifyToken(token);
      const jti = typeof payload?.jti === 'string' ? payload.jti : '';
      if (jti && (await this.isBlacklisted(jti))) {
        throw new UnauthorizedException({
          code: 'TOKEN_INVALID',
          message: 'Token is blacklisted',
        });
      }

      req.user = payload as Express.User;
      return true;
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
    const jwtConfig = resolveJwtRuntimeConfig(this.configService);
    if (jwtConfig.usedFallback && jwtConfig.warning && !this.jwtFallbackWarningLogged) {
      this.jwtFallbackWarningLogged = true;
      this.logger.warn(jwtConfig.warning);
    }

    const payload = verify(token, jwtConfig.verifyKey, {
      algorithms: [jwtConfig.algorithm],
    });

    return payload as JwtPayload;
  }

  private async isBlacklisted(jti: string): Promise<boolean> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
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
      .get(`jwt:blacklist:${jti}`)
      .catch(() => null);

    return Boolean(cachedToken);
  }
}
