import { IsEmail, IsString, Matches } from 'class-validator';
import { TAX_CODE_REGEX } from '../tenant.constants';

export class VerifyTaxCodeDto {
  @IsString()
  @Matches(TAX_CODE_REGEX)
  taxCode!: string;

  @IsEmail()
  email!: string;
}
