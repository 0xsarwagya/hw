import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateCollectionDto {
  @ApiProperty({
    description: "Collection name",
    example: "Summer Sale",
    maxLength: 255,
  })
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name: string;

  @ApiProperty({
    description: "Collection slug (auto-generated if not provided)",
    example: "summer-sale",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Slug must be a string" })
  @MaxLength(255, { message: "Slug must not exceed 255 characters" })
  slug?: string;

  @ApiProperty({
    description: "Collection description",
    example: "Hot summer deals and discounts",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(5000, { message: "Description must not exceed 5000 characters" })
  description?: string;

  @ApiProperty({
    description: "Collection image URL",
    example: "https://example.com/images/summer-sale.jpg",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Image URL must be a string" })
  @MaxLength(500, { message: "Image URL must not exceed 500 characters" })
  imageUrl?: string;
}

