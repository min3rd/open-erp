import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'success' in data &&
          ('data' in data || 'error' in data)
        ) {
          return data;
        }

        return {
          success: true,
          data,
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        };
      }),
    );
  }
}
