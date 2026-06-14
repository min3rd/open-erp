import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class SeedIndustryDto {
  @IsString({ message: 'validation.industry_must_be_string' })
  @IsNotEmpty({ message: 'validation.industry_required' })
  @IsIn(['technology', 'retail', 'manufacturing', 'services'], {
    message: 'validation.industry_invalid',
  })
  industry: 'technology' | 'retail' | 'manufacturing' | 'services';
}
