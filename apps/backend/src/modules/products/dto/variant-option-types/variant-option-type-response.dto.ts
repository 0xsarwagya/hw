import { ApiProperty } from "@nestjs/swagger";

export class VariantOptionTypeResponseDto {
  @ApiProperty({
    description: "Variant option type ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Name of the variant option type",
    example: "Size",
  })
  name: string;

  @ApiProperty({
    description: "Description of the variant option type",
    example: "Product size options",
    nullable: true,
  })
  description: string | null;

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

export class ProductVariantOptionTypeResponseDto {
  @ApiProperty({
    description: "Product variant option type ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Product ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productId: string;

  @ApiProperty({
    description: "Global option type template ID (if using template)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    nullable: true,
  })
  optionTypeId: string | null;

  @ApiProperty({
    description: "Name of the variant option type",
    example: "Size",
  })
  name: string;

  @ApiProperty({
    description: "Display order",
    example: 0,
  })
  displayOrder: number;

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

  @ApiProperty({
    description: "Option values for this option type",
    type: [Object],
    required: false,
  })
  values?: VariantOptionValueResponseDto[];
}

export class VariantOptionValueResponseDto {
  @ApiProperty({
    description: "Variant option value ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Product variant option type ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productVariantOptionTypeId: string;

  @ApiProperty({
    description: "Value",
    example: "M",
  })
  value: string;

  @ApiProperty({
    description: "Display order",
    example: 0,
  })
  displayOrder: number;

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
