import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class SignInstanceDto {
  @IsNotEmpty({ message: 'errors.instance_id_required' })
  @IsUUID('all', { message: 'errors.invalid_instance_id' })
  instanceId: string;

  @IsNotEmpty({ message: 'errors.step_id_required' })
  @IsUUID('all', { message: 'errors.invalid_step_id' })
  stepId: string;

  @IsNotEmpty({ message: 'errors.passphrase_required' })
  @IsString()
  @MinLength(6, { message: 'errors.passphrase_too_short' })
  passphrase: string;
}
