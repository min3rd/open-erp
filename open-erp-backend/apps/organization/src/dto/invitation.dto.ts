import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  MaxLength,
  IsDateString,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvitationScope } from '@shared/schemas';

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  inviteeEmail: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    enum: InvitationScope,
    required: false,
    default: InvitationScope.ORGANIZATION,
  })
  @IsEnum(InvitationScope)
  @IsOptional()
  scope?: InvitationScope;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}

export class InvitationRecipientDto {
  @ApiProperty({ required: false, description: 'User ID for registered users' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, description: 'Email for manual/unregistered recipients' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class BulkCreateInvitationDto {
  @ApiProperty({ type: [InvitationRecipientDto], description: 'List of recipients (userId or email)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvitationRecipientDto)
  recipients: InvitationRecipientDto[];

  @ApiProperty({ type: [String], required: false, default: ['member'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({ required: false, description: 'ISO date string for expiry' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ required: false, description: 'Expiry in days (used if expiresAt not set)', default: 7 })
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  expiryDays?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @ApiProperty({
    enum: InvitationScope,
    required: false,
    default: InvitationScope.ORGANIZATION,
  })
  @IsEnum(InvitationScope)
  @IsOptional()
  scope?: InvitationScope;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
