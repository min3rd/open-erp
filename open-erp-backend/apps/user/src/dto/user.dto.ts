import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsObject,
  IsBoolean,
  IsArray,
  IsDateString,
  ValidateNested,
  IsNumber,
  ArrayMaxSize,
  MaxDate,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiPropertyOptional({ description: 'Street address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ description: 'District', example: 'Downtown' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Province/State', example: 'NY' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;
}

export class EducationDto {
  @ApiPropertyOptional({ description: 'Degree', example: 'Bachelor of Science' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  degree?: string;

  @ApiPropertyOptional({ description: 'Institution', example: 'MIT' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional({ description: 'Year of graduation', example: 2020 })
  @IsNumber()
  @IsOptional()
  year?: number;
}

export class CreateUserDto {
  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Password' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  @Matches(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  )
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  @MaxDate(new Date(), { message: 'Date of birth cannot be in the future' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Education history', type: [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 education entries allowed' })
  education?: EducationDto[];

  @ApiPropertyOptional({ description: 'Skills', type: [String], example: ['JavaScript', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each skill must be max 100 characters' })
  @ArrayMaxSize(50, { message: 'Maximum 50 skills allowed' })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hobbies', type: [String], example: ['Reading', 'Swimming'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each hobby must be max 100 characters' })
  @ArrayMaxSize(50, { message: 'Maximum 50 hobbies allowed' })
  hobbies?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username', example: 'john_doe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  @Matches(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  )
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  @MaxDate(new Date(), { message: 'Date of birth cannot be in the future' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Education history', type: [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 education entries allowed' })
  education?: EducationDto[];

  @ApiPropertyOptional({ description: 'Skills', type: [String], example: ['JavaScript', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each skill must be max 100 characters' })
  @ArrayMaxSize(50, { message: 'Maximum 50 skills allowed' })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hobbies', type: [String], example: ['Reading', 'Swimming'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each hobby must be max 100 characters' })
  @ArrayMaxSize(50, { message: 'Maximum 50 hobbies allowed' })
  hobbies?: string[];
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Search query (searches username, email, name)',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'Scope: global or organization',
    enum: ['global', 'organization'],
  })
  @IsString()
  @IsOptional()
  scope?: 'global' | 'organization';

  @ApiPropertyOptional({
    description: 'Organization ID (required if scope=organization)',
  })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ description: 'Include memberships in response' })
  @IsBoolean()
  @IsOptional()
  includeMemberships?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: AddressDto })
  address?: AddressDto;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ type: [EducationDto] })
  education?: EducationDto[];

  @ApiPropertyOptional({ type: [String] })
  skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  hobbies?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [Object] })
  memberships?: any[];
}
