import { ApiProperty } from "@nestjs/swagger";
import { BundleSetItemResponseDto } from "./bundle-set-item-response.dto";

export class BundleSetResponseDto {
  @ApiProperty({
    description: "Set ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Set title",
    example: "Choose your T-shirt",
  })
  title: string;

  @ApiProperty({
    description: "Set description",
    example: "Select one T-shirt from the options",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Minimum quantity required",
    example: 1,
  })
  minQuantity: number;

  @ApiProperty({
    description: "Maximum quantity allowed",
    example: 1,
  })
  maxQuantity: number;

  @ApiProperty({
    description: "Sort order",
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: "Items in this set",
    type: [BundleSetItemResponseDto],
  })
  items: BundleSetItemResponseDto[];

  @ApiProperty({
    description: "Created at timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
