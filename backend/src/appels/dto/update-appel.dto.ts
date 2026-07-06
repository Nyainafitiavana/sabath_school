import {
  IsEnum, IsOptional, IsArray, ValidateNested, IsUUID,
  IsBoolean, IsInt, Min, Max, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutAppel } from '@prisma/client';

export class PresenceDto {
  @IsUUID()
  utilisateurId: string;

  @IsBoolean()
  present: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  frequenceApprentissage?: number | null;
}

export class ReponseQuestionDto {
  @IsUUID()
  questionId: string;

  @IsInt()
  @Min(0)
  valeur: number;
}

export class UpdateAppelDto {
  @IsOptional()
  @IsEnum(StatutAppel)
  statut?: StatutAppel;

  @IsOptional()
  @IsDateString()
  dateReelle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresenceDto)
  presences?: PresenceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReponseQuestionDto)
  reponses?: ReponseQuestionDto[];
}
