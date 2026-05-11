import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TAX_CODE_REGEX, TENANT_SUBDOMAIN_REGEX } from '../tenant.constants';

export class RegisterTenantDto {
  @IsString()
  @Length(2, 200)
  companyName!: string;

  @IsString()
  @Matches(TAX_CODE_REGEX)
  taxCode!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(TENANT_SUBDOMAIN_REGEX)
  subdomain!: string;

  @IsOptional()
  @IsString()
  @Length(8, 64)
  password?: string;
}
