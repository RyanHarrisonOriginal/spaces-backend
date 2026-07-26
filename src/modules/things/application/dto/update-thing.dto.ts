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
const STATUSES = ['idle', 'fetching', 'ready', 'error'] as const;

export class UpdateThingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(CONTENT_TYPES, { each: true })
  contentTypes?: Array<(typeof CONTENT_TYPES)[number]>;

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
