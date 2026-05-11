import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import argon2 from 'argon2';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserDocument,
  UserStatus,
} from '../../users/schemas/user.schema';
import { STORAGE_PROVISIONING_PORT } from '../adapters/storage-provisioning.port';
import type { StorageProvisioningPort } from '../adapters/storage-provisioning.port';
import { TenantRegistrationDocument } from '../schemas/tenant-registration.schema';
import { TenantDocument } from '../schemas/tenant.schema';

export interface OnboardingResult {
  bucketName: string;
  bucketCreated: boolean;
  storageProvider: string;
  adminUserId: string;
  adminUserEmail: string;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(STORAGE_PROVISIONING_PORT)
    private readonly storagePort: StorageProvisioningPort,
  ) {}

  async initializeTenant(
    tenant: TenantDocument,
    registration: TenantRegistrationDocument,
  ): Promise<OnboardingResult> {
    const tenantId = tenant._id;
    const email = registration.email.toLowerCase().trim();
    const bucketName = `tenant-${tenantId.toString()}`;

    // 1. Create Tenant Admin user record (idempotent: upsert by tenantId+email)
    let adminUser: UserDocument | null = await this.userModel
      .findOne({ tenantId, email, isDeleted: false })
      .exec();

    if (!adminUser) {
      // Generate a secure initial password — user must reset via forgot-password flow
      const initialPassword = uuidv4();
      const passwordHash = await argon2.hash(initialPassword);

      adminUser = await this.userModel.create({
        tenantId,
        email,
        passwordHash,
        roles: ['TENANT_ADMIN'],
        status: UserStatus.ACTIVE,
        tenantStatus: tenant.status,
        mfaEnabled: false,
        failedLoginCount: 0,
        isDeleted: false,
      });

      this.logger.log(
        `Tenant Admin user created: ${adminUser._id} for tenant ${tenantId}`,
      );
    } else {
      this.logger.debug(`Tenant Admin user already exists: ${adminUser._id}`);
    }

    // 2. Provision storage bucket
    const bucketResult = await this.storagePort.createBucket(bucketName);

    return {
      bucketName: bucketResult.bucketName,
      bucketCreated: bucketResult.created,
      storageProvider: bucketResult.provider,
      adminUserId: adminUser._id.toString(),
      adminUserEmail: adminUser.email,
    };
  }
}
