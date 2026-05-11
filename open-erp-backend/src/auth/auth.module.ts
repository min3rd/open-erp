import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantSchema } from '../tenant/schemas/tenant.schema';
import { TokenModule } from '../token/token.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { resolveJwtRuntimeConfig } from './auth-runtime.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TokenModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
        const jwtConfig = resolveJwtRuntimeConfig(configService);

        if (jwtConfig.algorithm === 'RS256') {
          return {
            privateKey: jwtConfig.signKey,
            publicKey: jwtConfig.verifyKey,
            signOptions: {
              algorithm: jwtConfig.algorithm,
              expiresIn: expiresIn as never,
            },
          };
        }

        return {
          secret: jwtConfig.signKey,
          signOptions: {
            algorithm: jwtConfig.algorithm,
            expiresIn: expiresIn as never,
          },
        };
      },
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Tenant.name,
        schema: TenantSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RabbitMQService],
})
export class AuthModule {}
