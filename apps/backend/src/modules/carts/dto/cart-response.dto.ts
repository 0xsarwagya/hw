import { ApiProperty } from "@nestjs/swagger";
import { UserBundleSelection } from "../../bundles/services/bundle-eligibility.service";

export class BundleVariantBreakdownDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Unit price for this variant",
    example: 999.99,
  })
  unitPrice: number;

  @ApiProperty({
    description: "Quantity of this variant in the bundle",
    example: 1,
  })
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty({
    description: "Cart item ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Item type: 'variant' or 'bundle'",
    example: "variant",
    enum: ["variant", "bundle"],
  })
  type: "variant" | "bundle";

  @ApiProperty({
    description:
      "Product variant ID (for variant items, or first variant for bundles)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productVariantId: string;

  @ApiProperty({
    description: "Bundle ID (only for bundle items)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  bundleId?: string;

  @ApiProperty({
    description: "Bundle selections (only for bundle items)",
    example: {
      "set-1": ["variant-1"],
      "set-2": ["variant-2"],
    },
    required: false,
  })
  selections?: UserBundleSelection;

  @ApiProperty({
    description: "Quantity",
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: "Price at time of adding to cart (unit price for bundles)",
    example: 999.99,
  })
  price: number;

  @ApiProperty({
    description: "Unit bundle price (only for bundle items)",
    example: 1999.98,
    required: false,
  })
  unitBundlePrice?: number;

  @ApiProperty({
    description: "Bundle variant breakdown (only for bundle items)",
    type: [BundleVariantBreakdownDto],
    required: false,
  })
  bundleVariantBreakdown?: BundleVariantBreakdownDto[];

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}

export class CartResponseDto {
  @ApiProperty({
    description: "Cart ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Customer ID (null for guest carts)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    nullable: true,
  })
  customerId: string | null;

  @ApiProperty({
    description: "Session ID (for guest carts)",
    example: "session_abc123",
    nullable: true,
  })
  sessionId: string | null;

  @ApiProperty({
    description: "Cart subtotal (before GST)",
    example: 1999.98,
  })
  subtotal: number;

  @ApiProperty({
    description: "GST amount",
    example: 359.99,
  })
  gstAmount: number;

  @ApiProperty({
    description: "Discount code applied",
    example: "SAVE20",
    nullable: true,
  })
  discountCode: string | null;

  @ApiProperty({
    description: "Discount amount",
    example: 200.0,
  })
  discountAmount: number;

  @ApiProperty({
    description: "GST breakdown details",
    example: {
      cgst: 180.0,
      sgst: 180.0,
      igst: 0,
      totalGst: 359.99,
      isIntraState: true,
    },
  })
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    isIntraState: boolean;
  };

  @ApiProperty({
    description: "Cart total (subtotal + GST)",
    example: 2359.97,
  })
  total: number;

  @ApiProperty({
    description: "Cart items",
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: "Cart expiration timestamp",
    example: "2025-12-03T00:00:00.000Z",
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}
