import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateVariantOptionValueDto {
  @ApiProperty({
    description: "Value for the variant option (e.g., 'XS', 'S', 'M', 'Red', 'Blue')",
    example: "M",
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Value is required" })
  @IsString({ message: "Value must be a string" })
  @MaxLength(100, { message: "Value must not exceed 100 characters" })
  value: string;

  @ApiProperty({
    description: "Display order for the value",
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Min(0, { message: "Display order must be greater than or equal to 0" })
  displayOrder?: number;
}

