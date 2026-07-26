import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const CONTENT_TYPES = ['video', 'article', 'image'] as const;

export class CreateThingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(CONTENT_TYPES, { each: true })
  contentTypes!: Array<(typeof CONTENT_TYPES)[number]>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
