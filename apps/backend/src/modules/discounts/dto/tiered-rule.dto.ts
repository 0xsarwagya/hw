import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNumber, Min } from "class-validator";

export enum DiscountValueType {
  AMOUNT = "AMOUNT",
  PERCENTAGE = "PERCENTAGE",
}

export class TieredRuleDto {
  @ApiProperty({
    description: "Minimum quantity for this tier",
    example: 3,
    required: true,
  })
  @Type(() => Number)
  @IsInt({ message: "Min quantity must be an integer" })
  @Min(1, { message: "Min quantity must be greater than 0" })
  minQuantity: number;

  @ApiProperty({
    description: "Discount value for this tier",
    example: 20,
    required: true,
  })
  @Type(() => Number)
  @IsNumber({}, { message: "Value must be a number" })
  @Min(0, { message: "Value must be greater than or equal to 0" })
  value: number;

  @ApiProperty({
    description: "Value type for this tier (AMOUNT or PERCENTAGE)",
    enum: DiscountValueType,
    example: DiscountValueType.PERCENTAGE,
    required: true,
  })
  @IsEnum(DiscountValueType, {
    message: `Value type must be one of: ${Object.values(DiscountValueType).join(", ")}`,
  })
  valueType: DiscountValueType;
}
