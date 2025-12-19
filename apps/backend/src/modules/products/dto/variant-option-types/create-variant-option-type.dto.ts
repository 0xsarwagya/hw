import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateVariantOptionTypeDto {
  @ApiProperty({
    description: "Name of the variant option type (e.g., 'Size', 'Color', 'Fabric')",
    example: "Size",
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must not exceed 100 characters" })
  name: string;

  @ApiProperty({
    description: "Description of the variant option type",
    example: "Product size options",
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(500, { message: "Description must not exceed 500 characters" })
  description?: string;
}

