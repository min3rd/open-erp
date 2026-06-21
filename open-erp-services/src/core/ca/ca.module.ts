import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SystemCa } from './entities/system-ca.entity';
import { UserCertificate } from './entities/user-certificate.entity';
import { User } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { WorkflowInstance } from '../workflow/entities/workflow-instance.entity';
import { WorkflowApprover } from '../workflow/entities/workflow-approver.entity';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';
import { CaService } from './ca.service';
import { CaController } from './ca.controller';
import { SignatureService } from './signature.service';
import { SignatureController } from './signature.controller';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemCa,
      UserCertificate,
      User,
      Tenant,
      WorkflowInstance,
      WorkflowApprover,
      WorkflowLog,
    ]),
    JwtModule.register({
      secret: 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
    WorkflowModule,
  ],
  controllers: [CaController, SignatureController],
  providers: [CaService, SignatureService],
  exports: [CaService, SignatureService],
})
export class CaModule {}
