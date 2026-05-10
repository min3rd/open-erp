import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    req.tenantId = this.extractTenantId(req);
    next();
  }

  private extractTenantId(req: Request): string | undefined {
    const fromJwt = req.user?.tenantId;
    if (fromJwt) {
      return fromJwt;
    }

    const fromHeader = req.header('x-tenant-id')?.trim();
    if (fromHeader) {
      return fromHeader;
    }

    const host = req.hostname || req.headers.host || '';
    const hostname = host.split(':')[0];
    const segments = hostname.split('.').filter(Boolean);

    if (segments.length >= 3) {
      const subdomain = segments[0].toLowerCase();
      if (!['api', 'www', 'localhost'].includes(subdomain)) {
        return subdomain;
      }
    }

    return undefined;
  }
}
