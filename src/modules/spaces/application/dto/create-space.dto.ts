import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  accent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  headerFont?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  bgColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  textColor?: string;

  @IsOptional()
  @IsIn(['card', 'list'])
  view?: 'card' | 'list';
}
