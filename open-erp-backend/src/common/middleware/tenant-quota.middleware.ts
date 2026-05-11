import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantService } from '../../tenant/tenant.service';

@Injectable()
export class TenantQuotaMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantId = req.tenantId;
    if (!tenantId) {
      next();
      return;
    }

    if (
      req.path.startsWith('/api/v1/auth') ||
      req.path.startsWith('/api/v1/health')
    ) {
      next();
      return;
    }

    await this.tenantService
      .enforceApiQuota(tenantId, req.path)
      .catch((error) => {
        if (error instanceof HttpException) {
          throw error;
        }

        throw new HttpException(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to enforce tenant quota',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

    next();
  }
}
