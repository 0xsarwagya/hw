import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class DuplicateOrderDto {
  @ApiProperty({
    description:
      "Update shipping address ID (optional - uses original if not provided)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "Shipping address ID must be a valid UUID" })
  shippingAddressId?: string;

  @ApiProperty({
    description:
      "Update billing address ID (optional - uses original if not provided)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "Billing address ID must be a valid UUID" })
  billingAddressId?: string;

  @ApiProperty({
    description: "Apply discount code (optional - recalculates discounts)",
    example: "SAVE10",
    required: false,
  })
  @IsOptional()
  @IsString()
  discountCode?: string;
}
