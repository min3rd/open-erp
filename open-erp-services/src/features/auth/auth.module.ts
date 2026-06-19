import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { RoleController } from './role.controller';
import { AuthService } from './auth.service';
import { Tenant } from '../../core/tenant/tenant.entity';
import { User } from '../../core/user/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Role, Permission]),
    JwtModule.register({
      secret: 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, RoleController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
