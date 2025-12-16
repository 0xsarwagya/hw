import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export enum DiscountType {
  STANDARD = "STANDARD",
  BUY_GET = "BUY_GET",
}

export enum DiscountApplicationType {
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
}

export enum DiscountValueType {
  AMOUNT = "AMOUNT",
  PERCENTAGE = "PERCENTAGE",
}

export enum DiscountScope {
  ORDER = "ORDER",
  PRODUCT = "PRODUCT",
}

export class CreateDiscountDto {
  @ApiProperty({
    description: "Discount code (unique identifier)",
    example: "SAVE20",
    required: true,
  })
  @IsString({ message: "Code must be a string" })
  code: string;

  @ApiProperty({
    description: "Discount name",
    example: "20% Off Summer Sale",
    required: true,
  })
  @IsString({ message: "Name must be a string" })
  name: string;

  @ApiProperty({
    description: "Discount description",
    example: "Get 20% off on all summer products",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "Discount type",
    enum: DiscountType,
    example: DiscountType.STANDARD,
    required: true,
  })
  @IsEnum(DiscountType, {
    message: `Type must be one of: ${Object.values(DiscountType).join(", ")}`,
  })
  type: DiscountType;

  @ApiProperty({
    description: "Application type (AUTOMATIC or MANUAL)",
    enum: DiscountApplicationType,
    example: DiscountApplicationType.MANUAL,
    default: DiscountApplicationType.MANUAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscountApplicationType, {
    message: `Application type must be one of: ${Object.values(DiscountApplicationType).join(", ")}`,
  })
  applicationType?: DiscountApplicationType = DiscountApplicationType.MANUAL;

  @ApiProperty({
    description: "Value type (AMOUNT or PERCENTAGE)",
    enum: DiscountValueType,
    example: DiscountValueType.PERCENTAGE,
    required: true,
  })
  @IsEnum(DiscountValueType, {
    message: `Value type must be one of: ${Object.values(DiscountValueType).join(", ")}`,
  })
  valueType: DiscountValueType;

  @ApiProperty({
    description: "Discount value (amount in INR or percentage 0-100)",
    example: 20,
    required: true,
  })
  @Type(() => Number)
  @IsNumber({}, { message: "Value must be a number" })
  @Min(0, { message: "Value must be greater than or equal to 0" })
  @ValidateIf((o) => o.valueType === DiscountValueType.PERCENTAGE)
  @Max(100, { message: "Percentage must be between 0 and 100" })
  value: number;

  @ApiProperty({
    description: "Minimum order amount to apply discount (INR)",
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Min order amount must be a number" })
  @Min(0, { message: "Min order amount must be greater than or equal to 0" })
  minOrderAmount?: number;

  @ApiProperty({
    description: "Maximum discount amount cap (for percentage discounts, INR)",
    example: 500,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Max discount amount must be a number" })
  @Min(0, { message: "Max discount amount must be greater than or equal to 0" })
  maxDiscountAmount?: number;

  @ApiProperty({
    description: "Discount scope (ORDER or PRODUCT)",
    enum: DiscountScope,
    example: DiscountScope.PRODUCT,
    default: DiscountScope.PRODUCT,
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscountScope, {
    message: `Scope must be one of: ${Object.values(DiscountScope).join(", ")}`,
  })
  scope?: DiscountScope = DiscountScope.PRODUCT;

  // STANDARD type: Products/Categories/Collections/Tags to apply discount to
  @ApiProperty({
    description: "Product IDs to apply discount to (STANDARD type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Product IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each product ID must be a valid UUID" })
  productIds?: string[];

  @ApiProperty({
    description: "Category IDs to apply discount to (STANDARD type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Category IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each category ID must be a valid UUID" })
  categoryIds?: string[];

  @ApiProperty({
    description: "Collection IDs to apply discount to (STANDARD type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Collection IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each collection ID must be a valid UUID",
  })
  collectionIds?: string[];

  @ApiProperty({
    description: "Tag IDs to apply discount to (STANDARD type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Tag IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each tag ID must be a valid UUID" })
  tagIds?: string[];

  // BUY_GET type: Products/Categories/Collections/Tags to buy
  @ApiProperty({
    description: "Product IDs to buy (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Buy product IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each buy product ID must be a valid UUID",
  })
  buyProductIds?: string[];

  @ApiProperty({
    description: "Category IDs to buy from (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Buy category IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each buy category ID must be a valid UUID",
  })
  buyCategoryIds?: string[];

  @ApiProperty({
    description: "Collection IDs to buy from (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Buy collection IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each buy collection ID must be a valid UUID",
  })
  buyCollectionIds?: string[];

  @ApiProperty({
    description: "Tag IDs to buy from (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Buy tag IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each buy tag ID must be a valid UUID" })
  buyTagIds?: string[];

  // BUY_GET type: Products/Categories/Collections/Tags to get discount on
  @ApiProperty({
    description: "Product IDs to get discount on (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Get product IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each get product ID must be a valid UUID",
  })
  getProductIds?: string[];

  @ApiProperty({
    description: "Category IDs to get discount on (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Get category IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each get category ID must be a valid UUID",
  })
  getCategoryIds?: string[];

  @ApiProperty({
    description: "Collection IDs to get discount on (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Get collection IDs must be an array" })
  @IsUUID(4, {
    each: true,
    message: "Each get collection ID must be a valid UUID",
  })
  getCollectionIds?: string[];

  @ApiProperty({
    description: "Tag IDs to get discount on (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Get tag IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each get tag ID must be a valid UUID" })
  getTagIds?: string[];

  @ApiProperty({
    description: "Discount start date",
    example: "2025-01-01T00:00:00.000Z",
    required: true,
  })
  @IsDateString({}, { message: "Start date must be a valid date string" })
  startDate: string;

  @ApiProperty({
    description: "Discount end date (null = no expiry)",
    example: "2025-12-31T23:59:59.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid date string" })
  endDate?: string;

  @ApiProperty({
    description: "Whether discount is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Is active must be a boolean" })
  isActive?: boolean = true;

  @ApiProperty({
    description: "Total usage limit (null = unlimited)",
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Usage limit must be an integer" })
  @Min(1, { message: "Usage limit must be greater than 0" })
  usageLimit?: number;

  @ApiProperty({
    description: "Usage limit per user (null = unlimited)",
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Per user limit must be an integer" })
  @Min(1, { message: "Per user limit must be greater than 0" })
  perUserLimit?: number;
}
