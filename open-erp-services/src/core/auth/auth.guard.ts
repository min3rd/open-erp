import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          messageKey: 'auth.unauthorized',
        },
      });
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'super-secret-jwt-key',
      });
      request['user'] = payload;

      // Enforce Tenant RLS Isolation
      const requestTenantId = request['tenantId'];
      if (requestTenantId && payload.tenantId !== requestTenantId) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'TENANT_MISMATCH',
            messageKey: 'auth.tenant_mismatch',
          },
        });
      }
    } catch {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          messageKey: 'auth.unauthorized',
        },
      });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
