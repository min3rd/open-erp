import { Injectable } from '@nestjs/common';
import { TenantDocument } from '../schemas/tenant.schema';
import { TenantRegistrationDocument } from '../schemas/tenant-registration.schema';

@Injectable()
export class OnboardingService {
  async initializeTenant(
    tenant: TenantDocument,
    registration: TenantRegistrationDocument,
  ): Promise<{ bucketName: string; adminUserEmail: string }> {
    return {
      bucketName: `tenant-${tenant.id}`,
      adminUserEmail: registration.email,
    };
  }
}
