import { ApiProperty } from "@nestjs/swagger";

export class SkuMovementDto {
  @ApiProperty({
    description: "SKU",
    example: "TSHIRT-BLACK-M",
  })
  sku: string;

  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Product title",
    example: "Premium T-Shirt",
  })
  productTitle: string;

  @ApiProperty({
    description: "Quantity moved (sold)",
    example: 150,
  })
  quantity: number;
}

export class InventoryHealthResponseDto {
  @ApiProperty({
    description: "Total stock across all variants",
    example: 10000,
  })
  totalStock: number;

  @ApiProperty({
    description: "Available stock (total - committed)",
    example: 8500,
  })
  availableStock: number;

  @ApiProperty({
    description: "Committed/reserved stock",
    example: 1500,
  })
  committedStock: number;

  @ApiProperty({
    description: "Number of variants with low stock",
    example: 12,
  })
  lowStockCount: number;

  @ApiProperty({
    description: "Number of variants that are out of stock",
    example: 3,
  })
  outOfStockCount: number;

  @ApiProperty({
    description: "Fastest moving SKUs (top 10)",
    type: [SkuMovementDto],
  })
  fastestMovingSkus: SkuMovementDto[];

  @ApiProperty({
    description: "Slowest moving SKUs (bottom 10)",
    type: [SkuMovementDto],
  })
  slowestMovingSkus: SkuMovementDto[];
}
