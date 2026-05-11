import { IsBoolean, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}