import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TwoFAVerifyDto {
  @ApiProperty({ description: 'Temporary auth token issued at login step 1' })
  @IsString()
  @IsNotEmpty()
  tempAuthToken: string;

  @ApiProperty({ description: 'TOTP OTP code (6 digits)' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class TwoFARecoveryDisableDto {
  @ApiProperty({ description: 'Temporary auth token issued at login step 1' })
  @IsString()
  @IsNotEmpty()
  tempAuthToken: string;

  @ApiProperty({ description: 'One-time recovery code' })
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}
