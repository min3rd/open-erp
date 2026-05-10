import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { JwtAuthMiddleware } from './common/middleware/jwt-auth.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [HealthModule, ProxyModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        RequestIdMiddleware,
        RateLimitMiddleware,
        JwtAuthMiddleware,
        TenantMiddleware,
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
