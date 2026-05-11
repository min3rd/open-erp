import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { VerifyTaxCodeDto } from './dto/verify-tax-code.dto';
import { TenantService } from './tenant.service';

@Controller({ path: 'register', version: '1' })
export class TenantRegistrationController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  async register(@Body() dto: RegisterTenantDto) {
    return this.tenantService.register(dto);
  }

  @Public()
  @Get('activate')
  async activateRegistration(@Query('token') token: string) {
    return this.tenantService.activateRegistration(token);
  }

  @Public()
  @Post('verify-tax-code')
  async verifyTaxCode(@Body() dto: VerifyTaxCodeDto) {
    return this.tenantService.verifyTaxCode(dto);
  }

  @Public()
  @Post('complete-onboarding')
  async completeOnboarding(@Body() dto: CompleteOnboardingDto) {
    return this.tenantService.completeOnboarding(dto);
  }

  /**
   * POST /api/v1/register/finalize-wizard/:tenantId
   * Called after the Onboarding Wizard (5-step) finishes on the frontend.
   * Publishes tenant.created so downstream services initialize default data.
   */
  @Public()
  @Post('finalize-wizard/:tenantId')
  async finalizeWizard(@Param('tenantId') tenantId: string) {
    return this.tenantService.finalizeWizard(tenantId);
  }
}
