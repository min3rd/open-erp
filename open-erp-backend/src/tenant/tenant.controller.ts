import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { UpdateTenantPlanDto } from './dto/update-tenant-plan.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async listTenants(@Query() query: ListTenantsQueryDto, @Req() req: Request) {
    return this.tenantService.listTenants(query, req.user);
  }

  @Get('me')
  async getMyTenant(@Req() req: Request) {
    return this.tenantService.getMyTenant(req.tenantId, req.user);
  }

  @Patch('me/settings')
  async updateMySettings(@Req() req: Request, @Body() dto: UpdateTenantSettingsDto) {
    return this.tenantService.updateMySettings(req.tenantId, req.user, dto);
  }

  @Get('me/settings')
  async getMySettings(@Req() req: Request) {
    return this.tenantService.getMySettings(req.tenantId, req.user);
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string, @Req() req: Request) {
    return this.tenantService.getTenantById(id, req.user);
  }

  @Patch(':id')
  async updateTenant(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(id, req.user, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteTenant(@Param('id') id: string, @Req() req: Request) {
    await this.tenantService.deleteTenant(id, req.user);
  }

  @Patch(':id/plan')
  async updateTenantPlan(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateTenantPlanDto,
  ) {
    return this.tenantService.updateTenantPlan(id, req.user, dto.plan);
  }

  @Patch(':id/approve')
  async approveTenant(@Param('id') id: string, @Req() req: Request) {
    return this.tenantService.approveTenant(id, req.user);
  }

  @Post(':id/activate')
  async activateTenant(@Param('id') id: string, @Req() req: Request) {
    return this.tenantService.activateTenant(id, req.user);
  }

  @Post(':id/suspend')
  async suspendTenant(@Param('id') id: string, @Req() req: Request) {
    return this.tenantService.suspendTenant(id, req.user);
  }
}
