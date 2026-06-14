import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tenant } from './core/tenant/tenant.entity';
import { User } from './core/user/user.entity';
import { AuthModule } from './features/auth/auth.module';
import { RedisModule } from './core/redis/redis.module';
import { TenantMiddleware } from './core/tenant/tenant.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'localpassword',
      database: 'open_erp_dev',
      entities: [Tenant, User],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Tenant]),
    RedisModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('{*splat}');
  }
}
