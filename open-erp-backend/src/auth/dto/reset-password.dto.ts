import { IsMongoId, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsMongoId()
  tenantId!: string;

  @IsMongoId()
  userId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
