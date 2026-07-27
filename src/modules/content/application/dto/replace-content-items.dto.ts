import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const CONTENT_TYPES = ['video', 'article', 'image'] as const;

export class ContentItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sourceId!: string;

  @IsIn(CONTENT_TYPES)
  type!: (typeof CONTENT_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnail?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  meta?: string;
}

export class ReplaceContentItemsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  items!: ContentItemDto[];
}
