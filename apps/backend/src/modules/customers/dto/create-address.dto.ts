import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const ADDRESS_TYPES = ["shipping", "billing", "both"] as const;

export class CreateAddressDto {
  @ApiProperty({
    description: "Address type",
    example: "shipping",
    enum: ADDRESS_TYPES,
    default: "shipping",
  })
  @IsOptional()
  @IsEnum(ADDRESS_TYPES, {
    message: `Type must be one of: ${ADDRESS_TYPES.join(", ")}`,
  })
  type?: (typeof ADDRESS_TYPES)[number] = "shipping";

  @ApiProperty({
    description: "Street address",
    example: "123 Main Street, Apartment 4B",
  })
  @IsNotEmpty({ message: "Street is required" })
  @IsString({ message: "Street must be a string" })
  @MaxLength(500, { message: "Street must not exceed 500 characters" })
  street: string;

  @ApiProperty({
    description: "City",
    example: "Mumbai",
  })
  @IsNotEmpty({ message: "City is required" })
  @IsString({ message: "City must be a string" })
  @MaxLength(100, { message: "City must not exceed 100 characters" })
  city: string;

  @ApiProperty({
    description: "State",
    example: "Maharashtra",
  })
  @IsNotEmpty({ message: "State is required" })
  @IsString({ message: "State must be a string" })
  @MaxLength(100, { message: "State must not exceed 100 characters" })
  state: string;

  @ApiProperty({
    description: "PIN code (6 digits)",
    example: "400001",
    pattern: "^\\d{6}$",
  })
  @IsNotEmpty({ message: "PIN code is required" })
  @IsString({ message: "PIN code must be a string" })
  pincode: string;

  @ApiProperty({
    description: "District",
    example: "Mumbai",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "District must be a string" })
  @MaxLength(100, { message: "District must not exceed 100 characters" })
  district?: string;

  @ApiProperty({
    description: "Country",
    example: "India",
    default: "India",
  })
  @IsOptional()
  @IsString({ message: "Country must be a string" })
  @MaxLength(100, { message: "Country must not exceed 100 characters" })
  country?: string = "India";
}
