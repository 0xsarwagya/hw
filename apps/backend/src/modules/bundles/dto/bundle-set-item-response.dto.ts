import { ApiProperty } from "@nestjs/swagger";

export class BundleSetItemResponseDto {
  @ApiProperty({
    description: "Item ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Product variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;
}
