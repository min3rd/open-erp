import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tenant } from './core/tenant/tenant.entity';
import { User } from './core/user/user.entity';
import { Branch } from './features/org/entities/branch.entity';
import { Department } from './features/org/entities/department.entity';
import { Employee } from './features/org/entities/employee.entity';
import { Role } from './features/auth/entities/role.entity';
import { Permission } from './features/auth/entities/permission.entity';
import { AuthModule } from './features/auth/auth.module';
import { OrgModule } from './features/org/org.module';
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
        entities: [Tenant, User, Branch, Department, Employee, Role, Permission],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
      }),
    }),
    TypeOrmModule.forFeature([Tenant]),
    RedisModule,
    AuthModule,
    OrgModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('{*splat}');
  }
}

