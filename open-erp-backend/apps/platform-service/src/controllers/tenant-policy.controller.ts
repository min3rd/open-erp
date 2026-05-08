import { Controller, Get, Patch, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  TenantGuard,
  SkipTenantCheck,
  TenantPolicyService,
  UpdateTenantPolicyDto,
  TenantPolicy,
} from '@shared/authz';
import { CurrentUser } from '@shared/authz';
import { Permissions } from '@shared/authz';

@ApiTags('tenant-policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('platform/tenants')
export class TenantPolicyController {
  private readonly logger = new Logger(TenantPolicyController.name);

  constructor(private readonly tenantPolicyService: TenantPolicyService) {}

  @Get(':tenantId/policy')
  @ApiOperation({ summary: 'Get policy for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant (organization) ID' })
  getPolicy(
    @Param('tenantId') tenantId: string,
    @CurrentUser() currentUser: any,
  ): TenantPolicy {
    // Only allow tenants to read their own policy (unless system admin)
    this.logger.log(
      `[TenantPolicy] GET policy tenantId=${tenantId} by user=${currentUser.userId}`,
    );
    return this.tenantPolicyService.getPolicy(tenantId);
  }

  @Patch(':tenantId/policy')
  @ApiOperation({ summary: 'Update policy for a tenant (system admin only)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant (organization) ID' })
  @SkipTenantCheck()
  updatePolicy(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantPolicyDto,
    @CurrentUser() currentUser: any,
  ): TenantPolicy {
    this.logger.log(
      `[TenantPolicy] PATCH policy tenantId=${tenantId} by user=${currentUser.userId}`,
    );
    return this.tenantPolicyService.updatePolicy(tenantId, dto);
  }
}
