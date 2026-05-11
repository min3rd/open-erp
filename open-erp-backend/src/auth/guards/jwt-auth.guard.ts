import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import type { Request } from 'express';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private redisClient: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.header('authorization') ?? '';
    const token = this.extractBearer(authHeader);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing bearer token',
      });
    }

    const payload = this.verifyToken(token);
    const jti = typeof payload?.jti === 'string' ? payload.jti : '';

    if (jti && (await this.isBlacklisted(jti))) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Token is blacklisted',
      });
    }

    req.user = {
      ...(payload as RequestUser),
      token,
    } as Express.User;

    return true;
  }

  private extractBearer(authHeader: string): string | null {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token.trim();
  }

  private verifyToken(token: string): RequestUser {
    const secret =
      this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-me';

    try {
      return this.jwtService.verify<RequestUser>(token, {
        secret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
      });
    }
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

      await this.redisClient.connect().catch(() => {
        this.redisClient = null;
      });

      if (!this.redisClient) {
        return false;
      }
    }

    const cached = await this.redisClient
      .get(`jwt:blacklist:${jti}`)
      .catch(() => null);

    return Boolean(cached);
  }
}
