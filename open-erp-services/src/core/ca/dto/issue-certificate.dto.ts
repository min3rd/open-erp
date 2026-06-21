import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class IssueCertificateDto {
  @IsNotEmpty({ message: 'errors.passphrase_required' })
  @IsString()
  @MinLength(6, { message: 'errors.passphrase_too_short' })
  passphrase: string;
}
