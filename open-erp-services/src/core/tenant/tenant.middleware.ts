import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { tenantContextStorage } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const subdomain = this.getSubdomain(host);

    const originalUrl = req.originalUrl;
    if (originalUrl.includes('/auth/check-subdomain') || originalUrl.includes('/auth/register')) {
      return next();
    }

    if (!subdomain) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SUBDOMAIN_REQUIRED',
          messageKey: 'auth.subdomain_required',
        },
      });
    }

    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });

    if (!tenant) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          messageKey: 'auth.tenant_not_found',
        },
      });
    }

    tenantContextStorage.run({ tenantId: tenant.id, subdomain: tenant.subdomain }, () => {
      req['tenantId'] = tenant.id;
      req['subdomain'] = tenant.subdomain;
      next();
    });
  }

  private getSubdomain(host: string): string | null {
    if (!host) return null;
    const domain = host.split(':')[0];
    const parts = domain.split('.');
    
    if (parts.length === 1) {
      return null;
    }
    
    if (domain.endsWith('.localhost')) {
      return parts.length > 1 ? parts[0] : null;
    }
    
    if (domain.endsWith('.open-erp.9ms.io.vn')) {
      return domain.replace('.open-erp.9ms.io.vn', '');
    }
    
    if (parts.length > 2) {
      return parts[0];
    }
    
    return null;
  }
}
