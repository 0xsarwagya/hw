import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from "class-validator";

export class UpdateOrderAddressDto {
  @ApiProperty({
    description: "Type of address to update",
    example: "shipping",
    enum: ["shipping", "billing"],
  })
  @IsEnum(["shipping", "billing"], {
    message: "Address type must be either 'shipping' or 'billing'",
  })
  @IsNotEmpty({ message: "Address type is required" })
  addressType: "shipping" | "billing";

  @ApiProperty({
    description: "Street address",
    example: "123 Main Street, Apartment 4B",
    required: false,
  })
  @IsString({ message: "Street must be a string" })
  @IsOptional()
  @MaxLength(500, { message: "Street must not exceed 500 characters" })
  street?: string;

  @ApiProperty({
    description: "City",
    example: "Mumbai",
    required: false,
  })
  @IsString({ message: "City must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "City must not exceed 100 characters" })
  city?: string;

  @ApiProperty({
    description: "State",
    example: "Maharashtra",
    required: false,
  })
  @IsString({ message: "State must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "State must not exceed 100 characters" })
  state?: string;

  @ApiProperty({
    description: "PIN code (6 digits)",
    example: "400001",
    pattern: "^\\d{6}$",
    required: false,
  })
  @IsString({ message: "PIN code must be a string" })
  @IsOptional()
  @Matches(/^\d{6}$/, {
    message: "PIN code must be exactly 6 digits",
  })
  pincode?: string;

  @ApiProperty({
    description: "Country",
    example: "India",
    required: false,
  })
  @IsString({ message: "Country must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "Country must not exceed 100 characters" })
  country?: string;

  @ApiProperty({
    description: "District",
    example: "Mumbai",
    required: false,
  })
  @IsString({ message: "District must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "District must not exceed 100 characters" })
  district?: string;
}

