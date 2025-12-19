import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { CollectionRuleDto } from "./collection-rule.dto";

export enum CollectionType {
  MANUAL = "manual",
  AUTOMATIC = "automatic",
}

export enum CollectionMatchType {
  ALL = "all",
  ANY = "any",
}

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

  @ApiProperty({
    description: "Collection type",
    enum: CollectionType,
    example: CollectionType.MANUAL,
    default: CollectionType.MANUAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CollectionType, { message: "Type must be 'manual' or 'automatic'" })
  type?: CollectionType;

  @ApiProperty({
    description: "Rules for automatic collections",
    type: [CollectionRuleDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Rules must be an array" })
  @ValidateNested({ each: true })
  @Type(() => CollectionRuleDto)
  rules?: CollectionRuleDto[];

  @ApiProperty({
    description: "Match type for automatic collections (all or any)",
    enum: CollectionMatchType,
    example: CollectionMatchType.ALL,
    default: CollectionMatchType.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CollectionMatchType, {
    message: "Match type must be 'all' or 'any'",
  })
  matchType?: CollectionMatchType;

  @ApiProperty({
    description: "Position for ordering",
    example: 0,
    required: false,
  })
  @IsOptional()
  position?: number;
}
