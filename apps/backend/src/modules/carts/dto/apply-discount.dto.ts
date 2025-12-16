import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ApplyDiscountDto {
  @ApiProperty({
    description: "Discount code to apply",
    example: "SAVE20",
    required: true,
  })
  @IsString({ message: "Discount code must be a string" })
  code: string;
}
