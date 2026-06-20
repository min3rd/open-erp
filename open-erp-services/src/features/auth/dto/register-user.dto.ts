import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'validation.email_required' })
  @IsEmail({}, { message: 'validation.email_invalid' })
  email: string;

  @IsNotEmpty({ message: 'validation.password_required' })
  @MinLength(6, { message: 'validation.password_min_length' })
  password: string;

  @IsNotEmpty({ message: 'validation.first_name_required' })
  @IsString({ message: 'validation.first_name_must_be_string' })
  firstName: string;

  @IsNotEmpty({ message: 'validation.last_name_required' })
  @IsString({ message: 'validation.last_name_must_be_string' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'validation.phone_must_be_string' })
  phone?: string;
}
