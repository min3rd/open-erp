import { IsMongoId, IsOptional, IsString, Length } from 'class-validator';

export class CompleteOnboardingDto {
  @IsMongoId()
  registrationId!: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  companyName?: string;
}
