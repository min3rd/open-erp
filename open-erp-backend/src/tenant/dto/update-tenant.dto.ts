import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { TenantPlan } from '../schemas/tenant.schema';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  companyName?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}
