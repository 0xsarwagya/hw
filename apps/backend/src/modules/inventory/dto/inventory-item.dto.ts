import { ApiProperty } from "@nestjs/swagger";

export class InventoryItemResponseDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Product ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productId: string;

  @ApiProperty({
    description: "SKU",
    example: "TSHIRT-BLACK-M",
  })
  sku: string;

  @ApiProperty({
    description: "Product title",
    example: "Premium T-Shirt",
  })
  title: string;

  @ApiProperty({
    description: "Product description",
    example: "A premium quality t-shirt",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Variant attributes (size, color, etc.)",
    example: { size: "M", color: "Black" },
    required: false,
  })
  attributes?: Record<string, string>;

  @ApiProperty({
    description: "Total inventory quantity",
    example: 100,
  })
  inventory: number;

  @ApiProperty({
    description: "Committed/reserved inventory quantity",
    example: 15,
  })
  committed: number;

  @ApiProperty({
    description: "Available inventory (inventory - committed)",
    example: 85,
  })
  available: number;

  @ApiProperty({
    description: "Low stock threshold for this variant",
    example: 5,
  })
  lowStockThreshold: number;

  @ApiProperty({
    description: "Whether this variant is low stock",
    example: false,
  })
  lowStock: boolean;

  @ApiProperty({
    description: "Last adjustment information",
    required: false,
  })
  lastAdjustment?: {
    id: string;
    type: string;
    quantity: number;
    reason: string;
    createdAt: Date;
    actorAdminId: string;
  };

  @ApiProperty({
    description: "Last updated timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  updatedAt: Date;
}
