import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res, Date.now() - startedAt),
        error: () => this.log(req, res, Date.now() - startedAt),
      }),
    );
  }

  private log(req: Request, res: Response, duration: number): void {
    this.logger.log(
      JSON.stringify({
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        tenantId: req.tenantId,
        userId: req.user?.sub,
        status: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
