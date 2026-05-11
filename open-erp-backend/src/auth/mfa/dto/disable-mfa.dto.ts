import { IsString, Length } from 'class-validator';

export class DisableMfaDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}