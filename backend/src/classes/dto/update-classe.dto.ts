import { IsString, IsOptional } from 'class-validator';

export class UpdateClasseDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
