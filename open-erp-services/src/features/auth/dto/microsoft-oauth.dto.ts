import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class MicrosoftOauthDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsOptional()
  @IsUUID('4')
  tenantId?: string;
}
