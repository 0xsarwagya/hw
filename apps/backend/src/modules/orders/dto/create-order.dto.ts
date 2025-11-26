import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({
    description: "Shipping address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Shipping address ID must be a valid UUID" })
  @IsNotEmpty({ message: "Shipping address ID is required" })
  shippingAddressId: string;

  @ApiProperty({
    description: "Billing address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Billing address ID must be a valid UUID" })
  @IsNotEmpty({ message: "Billing address ID is required" })
  billingAddressId: string;

  @ApiProperty({
    description: "Shipping cost in INR",
    example: 50.0,
    default: 0,
    required: false,
  })
  shippingCost?: number;
}
