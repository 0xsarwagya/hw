import { ApiProperty } from "@nestjs/swagger";
import {
  DiscountApplicationType,
  DiscountScope,
  DiscountType,
  DiscountValueType,
} from "./create-discount.dto";

export class DiscountResponseDto {
  @ApiProperty({
    description: "Discount ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Discount code",
    example: "SAVE20",
  })
  code: string;

  @ApiProperty({
    description: "Discount name",
    example: "20% Off Summer Sale",
  })
  name: string;

  @ApiProperty({
    description: "Discount description",
    example: "Get 20% off on all summer products",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Discount type",
    enum: DiscountType,
    example: DiscountType.STANDARD,
  })
  type: DiscountType;

  @ApiProperty({
    description: "Application type",
    enum: DiscountApplicationType,
    example: DiscountApplicationType.MANUAL,
  })
  applicationType: DiscountApplicationType;

  @ApiProperty({
    description: "Value type",
    enum: DiscountValueType,
    example: DiscountValueType.PERCENTAGE,
  })
  valueType: DiscountValueType;

  @ApiProperty({
    description: "Discount value",
    example: 20,
  })
  value: number;

  @ApiProperty({
    description: "Minimum order amount (INR)",
    example: 1000,
    nullable: true,
  })
  minOrderAmount: number | null;

  @ApiProperty({
    description: "Maximum discount amount (INR)",
    example: 500,
    nullable: true,
  })
  maxDiscountAmount: number | null;

  @ApiProperty({
    description: "Discount scope",
    enum: DiscountScope,
    example: DiscountScope.PRODUCT,
  })
  scope: DiscountScope;

  @ApiProperty({
    description: "Start date",
    example: "2025-01-01T00:00:00.000Z",
  })
  startDate: Date;

  @ApiProperty({
    description: "End date",
    example: "2025-12-31T23:59:59.000Z",
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    description: "Whether discount is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Total usage limit",
    example: 100,
    nullable: true,
  })
  usageLimit: number | null;

  @ApiProperty({
    description: "Current usage count",
    example: 45,
  })
  usageCount: number;

  @ApiProperty({
    description: "Usage limit per user",
    example: 1,
    nullable: true,
  })
  perUserLimit: number | null;

  @ApiProperty({
    description: "Product IDs",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  productIds: string[];

  @ApiProperty({
    description: "Category IDs",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  categoryIds: string[];

  @ApiProperty({
    description: "Collection IDs",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  collectionIds: string[];

  @ApiProperty({
    description: "Tag IDs",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  tagIds: string[];

  @ApiProperty({
    description: "Buy product IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  buyProductIds: string[];

  @ApiProperty({
    description: "Buy category IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  buyCategoryIds: string[];

  @ApiProperty({
    description: "Buy collection IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  buyCollectionIds: string[];

  @ApiProperty({
    description: "Buy tag IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  buyTagIds: string[];

  @ApiProperty({
    description: "Get product IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  getProductIds: string[];

  @ApiProperty({
    description: "Get category IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  getCategoryIds: string[];

  @ApiProperty({
    description: "Get collection IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  getCollectionIds: string[];

  @ApiProperty({
    description: "Get tag IDs (BUY_GET type)",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
    type: [String],
  })
  getTagIds: string[];

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
