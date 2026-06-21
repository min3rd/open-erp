import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class GoogleOauthDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsOptional()
  @IsUUID('4')
  tenantId?: string;
}
