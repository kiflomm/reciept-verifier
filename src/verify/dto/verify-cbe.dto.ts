import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyCbeDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;
}
