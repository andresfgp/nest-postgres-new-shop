import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  // Required
  @ApiProperty({
    nullable: false,
    description: 'Product Title (unique)',
    minLength: 1,
    required: true,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    required: true,
  })
  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  @ApiProperty({
    required: true,
    examples: ['men', 'woman', 'kid', 'unisex'],
  })
  @IsIn(['men', 'woman', 'kid', 'unisex'])
  gender: string;

  // Optional
  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  stock?: number;

  @ApiProperty({
    required: false,
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    required: false,
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}
