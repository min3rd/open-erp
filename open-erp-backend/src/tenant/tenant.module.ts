import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MinioStorageAdapter } from './adapters/minio-storage.adapter';
import { MockMstVerificationAdapter } from './adapters/mock-mst-verification.adapter';
import { MST_VERIFICATION_ADAPTER } from './adapters/mst-verification.adapter';
import { NullStorageAdapter } from './adapters/null-storage.adapter';
import { STORAGE_PROVISIONING_PORT } from './adapters/storage-provisioning.port';
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
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TenantRegistrationController, TenantController],
  providers: [
    TenantService,
    OnboardingService,
    RabbitMQService,
    MinioStorageAdapter,
    NullStorageAdapter,
    MockMstVerificationAdapter,
    {
      provide: STORAGE_PROVISIONING_PORT,
      useFactory: (minioAdapter: MinioStorageAdapter, configService: ConfigService) => {
        const endpoint = configService.get<string>('MINIO_ENDPOINT');
        // Use MinIO when endpoint is configured, else fall back to NullStorageAdapter
        return endpoint ? minioAdapter : new NullStorageAdapter();
      },
      inject: [MinioStorageAdapter, ConfigService],
    },
    {
      provide: MST_VERIFICATION_ADAPTER,
      useExisting: MockMstVerificationAdapter,
    },
  ],
})
export class TenantModule {}
