import { IsOptional, IsString, Length } from 'class-validator';

export class ChallengeMfaDto {
  @IsString()
  mfaToken!: string;

  @IsOptional()
  @IsString()
  @Length(6, 8)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  backupCode?: string;
}