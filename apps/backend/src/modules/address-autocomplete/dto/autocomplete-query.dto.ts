import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class StateAutocompleteQueryDto {
  @ApiProperty({
    description: "Search query for state name (minimum 2 characters)",
    example: "Mah",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Query is required" })
  @IsString({ message: "Query must be a string" })
  @MinLength(2, { message: "Query must be at least 2 characters long" })
  @MaxLength(100, { message: "Query must not exceed 100 characters" })
  query: string;

  @ApiProperty({
    description: "Maximum number of results to return",
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  limit?: number = 10;
}

export class DistrictAutocompleteQueryDto {
  @ApiProperty({
    description: "Search query for district name (minimum 2 characters)",
    example: "Mum",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Query is required" })
  @IsString({ message: "Query must be a string" })
  @MinLength(2, { message: "Query must be at least 2 characters long" })
  @MaxLength(100, { message: "Query must not exceed 100 characters" })
  query: string;

  @ApiProperty({
    description: "State name to filter districts (optional)",
    example: "Maharashtra",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "State must be a string" })
  @MaxLength(100, { message: "State must not exceed 100 characters" })
  state?: string;

  @ApiProperty({
    description: "Maximum number of results to return",
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  limit?: number = 10;
}
