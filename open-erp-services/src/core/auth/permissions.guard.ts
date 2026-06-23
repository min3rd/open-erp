import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { User } from '../user/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are explicitly required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload || !userPayload.userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          messageKey: 'auth.forbidden',
        },
      });
    }

    const userId = userPayload.userId;
    const cacheKey = `user:permissions:${userId}`;

    let permissions: string[] = [];

    // 1. Try to read permissions from Redis Cache
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        permissions = JSON.parse(cached);
      }
    } catch (e) {
      // Fallback if Redis is down
      console.error('Failed to get permissions from Redis', e);
    }

    // 2. If Cache Miss, fetch from PostgreSQL DB
    if (permissions.length === 0) {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: userId },
        relations: {
          roles: {
            permissions: true
          }
        },
      });

      if (user && user.roles) {
        for (const role of user.roles) {
          if (role.permissions) {
            for (const perm of role.permissions) {
              if (!permissions.includes(perm.code)) {
                permissions.push(perm.code);
              }
            }
          }
        }
      }

      // Write permissions back to Redis Cache with 1 hour TTL
      try {
        await this.redisService.set(cacheKey, JSON.stringify(permissions), 3600);
      } catch (e) {
        console.error('Failed to save permissions to Redis', e);
      }
    }

    // 3. Match user permissions with required permissions
    // User must have AT LEAST ONE of the required permissions to access
    const hasPermission = requiredPermissions.some((perm) =>
      permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          messageKey: 'auth.forbidden',
        },
      });
    }

    return true;
  }
}
