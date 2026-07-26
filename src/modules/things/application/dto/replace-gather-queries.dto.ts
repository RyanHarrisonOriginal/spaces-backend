import { ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';

export class ReplaceGatherQueriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  queries!: string[];
}
