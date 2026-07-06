import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateQuestionGlobaleDto {
  @IsString()
  code: string;

  @IsString()
  libelle: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;
}
