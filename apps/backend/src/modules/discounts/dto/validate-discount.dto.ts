import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ValidateDiscountDto {
  @ApiProperty({
    description: "Discount code to validate",
    example: "SAVE20",
    required: true,
  })
  @IsString({ message: "Discount code must be a string" })
  code: string;

  @ApiProperty({
    description: "Order amount for minimum order validation (INR)",
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Order amount must be a number" })
  @Min(0, { message: "Order amount must be greater than or equal to 0" })
  orderAmount?: number;
}
