import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SystemCa } from './entities/system-ca.entity';
import { UserCertificate } from './entities/user-certificate.entity';
import { User } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { CaService } from './ca.service';
import { CaController } from './ca.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemCa, UserCertificate, User, Tenant]),
    JwtModule.register({
      secret: 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [CaController],
  providers: [CaService],
  exports: [CaService],
})
export class CaModule {}
