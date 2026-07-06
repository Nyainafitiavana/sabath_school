import { IsString, IsOptional, IsEmail, IsEnum, IsUUID, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUtilisateurDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  classeId?: string | null;

  @IsOptional()
  @IsString()
  contact?: string;
}
