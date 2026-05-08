import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Tenant Policy DTO
 */
export class UpdateTenantPolicyDto {
  @ApiProperty({ description: 'Max API requests per minute (1-10000)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitPerMinute?: number;

  @ApiProperty({ description: 'Max storage in MB', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorageMb?: number;

  @ApiProperty({ description: 'Allow data export?', required: false })
  @IsOptional()
  allowDataExport?: boolean;
}

export interface TenantPolicy {
  tenantId: string;
  rateLimitPerMinute: number;
  maxStorageMb: number;
  allowDataExport: boolean;
  updatedAt: Date;
}

/**
 * TenantPolicyService — In-memory policy store (extend with MongoDB persistence as needed).
 *
 * Provides per-tenant configuration for rate limiting, storage quotas, and feature flags.
 * This is the runtime-accessible policy consumed by guards and interceptors.
 */
@Injectable()
export class TenantPolicyService {
  private readonly logger = new Logger(TenantPolicyService.name);
  private readonly policies = new Map<string, TenantPolicy>();

  private defaults: Omit<TenantPolicy, 'tenantId' | 'updatedAt'> = {
    rateLimitPerMinute: 300,
    maxStorageMb: 5120,
    allowDataExport: true,
  };

  getPolicy(tenantId: string): TenantPolicy {
    return (
      this.policies.get(tenantId) ?? {
        tenantId,
        ...this.defaults,
        updatedAt: new Date(),
      }
    );
  }

  updatePolicy(tenantId: string, dto: UpdateTenantPolicyDto): TenantPolicy {
    const existing = this.getPolicy(tenantId);
    const updated: TenantPolicy = {
      ...existing,
      ...dto,
      tenantId,
      updatedAt: new Date(),
    };
    this.policies.set(tenantId, updated);
    this.logger.log(`[TenantPolicy] Updated policy for tenant=${tenantId}`);
    return updated;
  }
}
