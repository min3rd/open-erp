import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString({ message: 'validation.department_name_must_be_string' })
  @IsNotEmpty({ message: 'validation.department_name_required' })
  @MaxLength(255)
  name: string;

  @IsUUID('4', { message: 'validation.parent_id_must_be_uuid' })
  @IsOptional()
  parentId?: string | null;

  @IsUUID('4', { message: 'validation.branch_id_must_be_uuid' })
  @IsOptional()
  branchId?: string | null;

  @IsUUID('4', { message: 'validation.manager_id_must_be_uuid' })
  @IsOptional()
  managerId?: string | null;
}

export class UpdateDepartmentDto {
  @IsString({ message: 'validation.department_name_must_be_string' })
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsUUID('4', { message: 'validation.parent_id_must_be_uuid' })
  @IsOptional()
  parentId?: string | null;

  @IsUUID('4', { message: 'validation.branch_id_must_be_uuid' })
  @IsOptional()
  branchId?: string | null;

  @IsUUID('4', { message: 'validation.manager_id_must_be_uuid' })
  @IsOptional()
  managerId?: string | null;
}
