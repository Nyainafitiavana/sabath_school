import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateClasseDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  registreId: string;
}
