import { IsEnum } from 'class-validator';
import { TenantPlan } from '../schemas/tenant.schema';

export class UpdateTenantPlanDto {
  @IsEnum(TenantPlan)
  plan!: TenantPlan;
}
