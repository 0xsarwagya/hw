import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CalculateRatesDto {
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

  @ApiProperty({
    description: "Additional weight in kg (for multiple items)",
    example: 0.5,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Additional weight must be a number" })
  @Min(0, { message: "Additional weight must be at least 0" })
  additionalWeight?: number;
}

export class CourierRateDto {
  @ApiProperty({
    description: "Courier ID",
    example: 1,
  })
  courierId: number;

  @ApiProperty({
    description: "Courier name",
    example: "BlueDart",
  })
  courierName: string;

  @ApiProperty({
    description: "Rate in INR",
    example: 150.0,
  })
  rate: number;

  @ApiProperty({
    description: "Estimated delivery time in days",
    example: 3,
    nullable: true,
  })
  estimatedDeliveryDays: number | null;

  @ApiProperty({
    description: "COD charges in INR",
    example: 20.0,
  })
  codCharges: number;

  @ApiProperty({
    description: "Total rate including COD charges",
    example: 170.0,
  })
  totalRate: number;

  @ApiProperty({
    description: "Whether COD is available",
    example: true,
  })
  codAvailable: boolean;

  @ApiProperty({
    description: "Whether the courier is recommended",
    example: false,
  })
  isRecommended: boolean;
}

export class CalculateRatesResponseDto {
  @ApiProperty({
    description: "Pickup PIN code",
    example: "400001",
  })
  pickupPincode: string;

  @ApiProperty({
    description: "Delivery PIN code",
    example: "110001",
  })
  deliveryPincode: string;

  @ApiProperty({
    description: "Weight in kg",
    example: 1.5,
  })
  weight: number;

  @ApiProperty({
    description: "Order value in INR",
    example: 1999.99,
  })
  orderValue: number;

  @ApiProperty({
    description: "COD amount in INR (if applicable)",
    example: 1999.99,
    nullable: true,
  })
  codAmount: number | null;

  @ApiProperty({
    description: "Available courier rates",
    type: [CourierRateDto],
  })
  courierRates: CourierRateDto[];

  @ApiProperty({
    description: "Total number of couriers available",
    example: 5,
  })
  totalCouriers: number;

  @ApiProperty({
    description: "Message regarding the rate calculation",
    example: "Rates calculated successfully",
  })
  message: string;
}
