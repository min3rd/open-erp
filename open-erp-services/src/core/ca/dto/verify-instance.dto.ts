import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyInstanceDto {
  @IsNotEmpty({ message: 'errors.instance_id_required' })
  @IsUUID('all', { message: 'errors.invalid_instance_id' })
  instanceId: string;
}
