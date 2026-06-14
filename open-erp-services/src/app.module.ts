import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tenant } from './core/tenant/tenant.entity';
import { User } from './core/user/user.entity';
import { AuthModule } from './features/auth/auth.module';
import { RedisModule } from './core/redis/redis.module';
import { TenantMiddleware } from './core/tenant/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'localpassword'),
        database: configService.get<string>('DB_DATABASE', 'open_erp_dev'),
        entities: [Tenant, User],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
      }),
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
