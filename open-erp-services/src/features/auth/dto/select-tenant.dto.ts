import { IsEmail, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class SelectTenantDto {
  @IsNotEmpty({ message: 'validation.email_required' })
  @IsEmail({}, { message: 'validation.email_invalid' })
  email: string;

  @IsNotEmpty({ message: 'validation.password_required' })
  @MinLength(6, { message: 'validation.password_min_length' })
  password: string;

  @IsNotEmpty({ message: 'validation.tenant_id_required' })
  @IsUUID('4', { message: 'validation.tenant_id_invalid' })
  tenantId: string;
}
