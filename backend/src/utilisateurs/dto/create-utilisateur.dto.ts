import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUtilisateurDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEnum(Role)
  role: Role;

  @ValidateIf((o) => o.role === Role.ADMIN || o.role === Role.RESPONSABLE)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => o.role === Role.ADMIN || o.role === Role.RESPONSABLE)
  @IsString()
  @MinLength(6)
  password?: string;

  @ValidateIf((o) => o.role === Role.RESPONSABLE || o.role === Role.MEMBRE)
  @IsUUID()
  classeId?: string;

  @IsOptional()
  @IsString()
  contact?: string;
}
