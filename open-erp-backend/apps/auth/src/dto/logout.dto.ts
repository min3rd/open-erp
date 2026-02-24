import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token to revoke. If not provided, all user sessions will be revoked.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    minLength: 64,
    maxLength: 64,
  })
  @IsOptional()
  @IsString({ message: 'Refresh token must be a string' })
  @Length(64, 64, { message: 'Refresh token must be exactly 64 characters' })
  refreshToken?: string;
}
