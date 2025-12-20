import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CourierServiceabilityQueryDto {
  @ApiProperty({
    description: "Pickup PIN code (seller location)",
    example: "400001",
  })
  @IsString({ message: "Pickup PIN code must be a string" })
  @IsNotEmpty({ message: "Pickup PIN code is required" })
  pickupPincode: string;

  @ApiProperty({
    description: "Delivery PIN code (buyer location)",
    example: "110001",
  })
  @IsString({ message: "Delivery PIN code must be a string" })
  @IsNotEmpty({ message: "Delivery PIN code is required" })
  deliveryPincode: string;

  @ApiProperty({
    description: "Weight of the shipment in kg",
    example: 1.5,
    minimum: 0.1,
  })
  @IsNumber({}, { message: "Weight must be a number" })
  @IsNotEmpty({ message: "Weight is required" })
  @Min(0.1, { message: "Weight must be at least 0.1 kg" })
  weight: number;

  @ApiProperty({
    description: "Order value in INR",
    example: 1999.99,
    minimum: 0,
  })
  @IsNumber({}, { message: "Order value must be a number" })
  @IsNotEmpty({ message: "Order value is required" })
  @Min(0, { message: "Order value must be at least 0" })
  orderValue: number;

  @ApiProperty({
    description: "COD amount in INR (if COD is selected)",
    example: 1999.99,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "COD amount must be a number" })
  @Min(0, { message: "COD amount must be at least 0" })
  codAmount?: number;
}

