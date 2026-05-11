import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name!: string;

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
}
