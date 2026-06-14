import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString({ message: 'validation.branch_name_must_be_string' })
  @IsNotEmpty({ message: 'validation.branch_name_required' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsEmail({}, { message: 'validation.email_invalid' })
  @IsOptional()
  @MaxLength(255)
  email?: string;
}

export class UpdateBranchDto {
  @IsString({ message: 'validation.branch_name_must_be_string' })
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsEmail({}, { message: 'validation.email_invalid' })
  @IsOptional()
  @MaxLength(255)
  email?: string;
}
