import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AddBundleSetItemDto {
  @ApiProperty({
    description: "Product variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsUUID(4, { message: "Variant ID must be a valid UUID" })
  variantId: string;
}
