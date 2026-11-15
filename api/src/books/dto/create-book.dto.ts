import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  author: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  isbn: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  totalCopies: number;

  @IsInt()
  @Min(1)
  genreId: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(2100)
  publishedYear?: number;
}
