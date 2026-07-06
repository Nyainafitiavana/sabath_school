import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateQuestionGlobaleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  libelle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;
}
