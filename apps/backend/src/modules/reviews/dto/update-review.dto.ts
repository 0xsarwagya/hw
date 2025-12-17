import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateReviewDto {
  @ApiProperty({
    description: "Rating (1-5)",
    example: 4,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: "Rating must be an integer" })
  @Min(1, { message: "Rating must be at least 1" })
  @Max(5, { message: "Rating must be at most 5" })
  rating?: number;

  @ApiProperty({
    description: "Review title",
    example: "Updated review title",
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: "Title must be a string" })
  @MaxLength(200, { message: "Title must not exceed 200 characters" })
  title?: string;

  @ApiProperty({
    description: "Review body",
    example: "Updated review content",
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: "Body must be a string" })
  @MaxLength(2000, { message: "Review body must not exceed 2000 characters" })
  body?: string;

  @ApiProperty({
    description: "Array of image URLs (max 5 images)",
    example: ["https://example.com/image1.jpg"],
    required: false,
    type: [String],
    maxItems: 5,
  })
  @IsOptional()
  @IsArray({ message: "Images must be an array" })
  @ArrayMaxSize(5, { message: "Maximum 5 images allowed" })
  @IsString({ each: true, message: "Each image URL must be a string" })
  images?: string[];
}
