import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateReviewDto {
  @ApiProperty({
    description: "Order ID (must be a completed order)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Order ID must be a valid UUID" })
  @IsNotEmpty({ message: "Order ID is required" })
  orderId: string;

  @ApiProperty({
    description: "Product variant ID being reviewed",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Variant ID must be a valid UUID" })
  @IsNotEmpty({ message: "Variant ID is required" })
  variantId: string;

  @ApiProperty({
    description: "Rating (1-5)",
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: "Rating must be an integer" })
  @Min(1, { message: "Rating must be at least 1" })
  @Max(5, { message: "Rating must be at most 5" })
  @IsNotEmpty({ message: "Rating is required" })
  rating: number;

  @ApiProperty({
    description: "Review title (optional)",
    example: "Great product!",
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: "Title must be a string" })
  @MaxLength(200, { message: "Title must not exceed 200 characters" })
  title?: string;

  @ApiProperty({
    description: "Review body (required)",
    example: "This product exceeded my expectations. Highly recommend!",
    maxLength: 2000,
  })
  @IsString({ message: "Body must be a string" })
  @IsNotEmpty({ message: "Review body is required" })
  @MaxLength(2000, { message: "Review body must not exceed 2000 characters" })
  body: string;

  @ApiProperty({
    description: "Array of image URLs (max 5 images)",
    example: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
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
