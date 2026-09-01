import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['web', 'news', 'video', 'image'], { each: true })
  braveContentTypes?: Array<'web' | 'news' | 'video' | 'image'>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
