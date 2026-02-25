import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsObject,
  IsArray,
  IsDateString,
  ArrayMaxSize,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  @Matches(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    { message: 'Invalid phone number format' },
  )
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar MinIO object key' })
  @IsString()
  @IsOptional()
  avatarKey?: string;

  @ApiPropertyOptional({ description: 'Avatar MinIO bucket name' })
  @IsString()
  @IsOptional()
  avatarBucket?: string;

  @ApiPropertyOptional({ description: 'Address details' })
  @IsOptional()
  @IsObject()
  address?: {
    country?: string;
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Skills', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hobbies', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  hobbies?: string[];
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Date format preference',
    example: 'DD/MM/YYYY',
  })
  @IsString()
  @IsOptional()
  dateFormat?: string;

  @ApiPropertyOptional({
    description: 'Time zone',
    example: 'Asia/Ho_Chi_Minh',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Theme preference',
    enum: ['light', 'dark', 'auto'],
  })
  @IsEnum(['light', 'dark', 'auto'])
  @IsOptional()
  theme?: 'light' | 'dark' | 'auto';

  @ApiPropertyOptional({
    description: 'Language preference',
    example: 'vi',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Layout density',
    enum: ['compact', 'comfortable'],
  })
  @IsEnum(['compact', 'comfortable'])
  @IsOptional()
  layoutDensity?: 'compact' | 'comfortable';

  @ApiPropertyOptional({ description: 'In-app notifications enabled' })
  @IsBoolean()
  @IsOptional()
  notificationsInApp?: boolean;

  @ApiPropertyOptional({ description: 'Email notifications enabled' })
  @IsBoolean()
  @IsOptional()
  notificationsEmail?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications enabled' })
  @IsBoolean()
  @IsOptional()
  notificationsPush?: boolean;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Password confirmation for account closure' })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  password: string;
}
