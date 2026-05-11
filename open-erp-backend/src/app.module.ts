import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { TenantQuotaMiddleware } from './common/middleware/tenant-quota.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';
import { OAuthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ??
          'mongodb://localhost:27017/openErp-auth',
        autoIndex: true,
      }),
    }),
    HealthModule,
    ProxyModule,
    AuthModule,
    OAuthModule,
    TenantModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RateLimitMiddleware, TenantMiddleware, TenantQuotaMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
