import { ApiProperty } from "@nestjs/swagger";

export class VariantIndexItemDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "SKU",
    example: "TSHIRT-BLACK-M",
  })
  sku: string;

  @ApiProperty({
    description: "Product title",
    example: "Premium T-Shirt",
  })
  productTitle: string;

  @ApiProperty({
    description: "Variant attributes (size, color, etc.)",
    example: { size: "M", color: "Black" },
    required: false,
  })
  attributes?: Record<string, string>;
}

export class VariantsIndexResponseDto {
  @ApiProperty({
    description: "List of variants with basic info",
    type: [VariantIndexItemDto],
  })
  variants: VariantIndexItemDto[];
}
