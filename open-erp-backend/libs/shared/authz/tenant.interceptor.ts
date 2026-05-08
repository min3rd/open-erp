import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * TenantInterceptor — Log every request with tenant_id for auditability.
 *
 * Attaches tenant_id to the logger context and records the outcome.
 * Should be used globally or at controller level after TenantGuard.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.tenantId ?? request.user?.organizationId;
    const userId: string | undefined = request.user?.userId;
    const method: string = request.method;
    const url: string = request.url;

    if (tenantId) {
      this.logger.log(
        `[tenant=${tenantId}] [user=${userId ?? 'n/a'}] ${method} ${url}`,
      );
    }

    return next.handle().pipe(
      tap({
        error: (err: Error) => {
          this.logger.error(
            `[tenant=${tenantId ?? 'n/a'}] [user=${userId ?? 'n/a'}] ${method} ${url} — ${err.message}`,
          );
        },
      }),
    );
  }
}
