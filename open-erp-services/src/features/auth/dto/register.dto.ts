import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'validation.company_name_required' })
  @IsString({ message: 'validation.company_name_must_be_string' })
  companyName: string;

  @IsNotEmpty({ message: 'validation.email_required' })
  @IsEmail({}, { message: 'validation.email_invalid' })
  email: string;

  @IsNotEmpty({ message: 'validation.password_required' })
  @MinLength(6, { message: 'validation.password_min_length' })
  password: string;

  @IsNotEmpty({ message: 'validation.subdomain_required' })
  @Matches(/^[a-z0-9]+$/, { message: 'validation.subdomain_invalid' })
  subdomain: string;

  @IsOptional()
  @IsString({ message: 'validation.phone_must_be_string' })
  phone?: string;
}
