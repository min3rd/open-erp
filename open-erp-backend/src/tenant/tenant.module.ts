import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { MockMstVerificationAdapter } from './adapters/mock-mst-verification.adapter';
import { MST_VERIFICATION_ADAPTER } from './adapters/mst-verification.adapter';
import { OnboardingService } from './onboarding/onboarding.service';
import {
  TenantRegistration,
  TenantRegistrationSchema,
} from './schemas/tenant-registration.schema';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantRegistrationController } from './tenant-registration.controller';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantRegistration.name, schema: TenantRegistrationSchema },
    ]),
  ],
  controllers: [TenantRegistrationController, TenantController],
  providers: [
    TenantService,
    OnboardingService,
    RabbitMQService,
    MockMstVerificationAdapter,
    {
      provide: MST_VERIFICATION_ADAPTER,
      useExisting: MockMstVerificationAdapter,
    },
  ],
})
export class TenantModule {}
