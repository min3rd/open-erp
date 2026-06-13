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
    const originalUrl = req.originalUrl;
    if (originalUrl.includes('/auth/check-subdomain') || originalUrl.includes('/auth/register')) {
      return next();
    }

    const host = req.headers.host || '';
    const hostSubdomain = this.getSubdomain(host);
    const headerTenantId = req.headers['x-tenant-id'] as string;
    const headerSubdomain = req.headers['x-subdomain'] as string;

    let tenant: Tenant | null = null;

    if (headerTenantId) {
      tenant = await this.tenantRepository.findOne({
        where: { id: headerTenantId },
      });
    } else {
      const subdomainToFind = headerSubdomain || hostSubdomain;
      if (subdomainToFind) {
        tenant = await this.tenantRepository.findOne({
          where: { subdomain: subdomainToFind.toLowerCase() },
        });
      }
    }

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
    const domain = host.split(':')[0].toLowerCase();
    
    const baseDomain = (process.env.APP_DOMAIN || 'localhost').toLowerCase();
    
    if (domain === baseDomain) {
      return null;
    }
    
    if (domain.endsWith('.' + baseDomain)) {
      return domain.slice(0, -(baseDomain.length + 1));
    }
    
    return null;
  }
}
