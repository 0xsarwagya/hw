import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsUUID, ArrayMinSize } from "class-validator";

export class AddProductsDto {
  @ApiProperty({
    description: "Array of product IDs to add to collection",
    example: [
      "123e4567-e89b-12d3-a456-426614174000",
      "223e4567-e89b-12d3-a456-426614174001",
    ],
    type: [String],
  })
  @IsArray({ message: "Product IDs must be an array" })
  @ArrayMinSize(1, { message: "At least one product ID is required" })
  @IsUUID(4, { each: true, message: "Each product ID must be a valid UUID" })
  productIds: string[];
}

