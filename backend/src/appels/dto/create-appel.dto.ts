import { IsUUID, IsInt, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Sabbat } from '@prisma/client';

export class CreateAppelDto {
  @IsUUID()
  classeId: string;

  @IsInt()
  @Min(1)
  @Max(4)
  trimestre: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mois: number;

  @IsEnum(Sabbat)
  sabbat: Sabbat;

  @IsOptional()
  @IsDateString()
  dateReelle?: string;
}
