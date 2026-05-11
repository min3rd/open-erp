import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsString()
  positionTitle?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
