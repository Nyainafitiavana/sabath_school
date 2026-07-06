import { IsInt, Min, Max } from 'class-validator';

export class CreateRegistreDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  annee: number;
}
