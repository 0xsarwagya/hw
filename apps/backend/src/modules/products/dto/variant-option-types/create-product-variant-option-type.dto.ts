import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateProductVariantOptionTypeDto {
  @ApiProperty({
    description:
      "ID of the global variant option type template (optional if creating custom option type)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Option type ID must be a valid UUID" })
  optionTypeId?: string;

  @ApiProperty({
    description:
      "Name of the variant option type (required if not using template)",
    example: "Size",
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must not exceed 100 characters" })
  name: string;

  @ApiProperty({
    description: "Display order for the option type",
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Min(0, { message: "Display order must be greater than or equal to 0" })
  displayOrder?: number;
}

