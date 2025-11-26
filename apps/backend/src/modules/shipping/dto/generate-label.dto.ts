import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class GenerateLabelDto {
  @ApiProperty({
    description: "Order ID for which to generate the label",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Order ID must be a valid UUID" })
  @IsNotEmpty({ message: "Order ID is required" })
  orderId: string;

  @ApiProperty({
    description: "Courier ID selected for shipping",
    example: 1,
  })
  @IsNumber({}, { message: "Courier ID must be a number" })
  @IsNotEmpty({ message: "Courier ID is required" })
  @Min(1, { message: "Courier ID must be at least 1" })
  courierId: number;

  @ApiProperty({
    description: "Pickup PIN code (seller location)",
    example: "400001",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Pickup PIN code must be a string" })
  pickupPincode?: string;

  @ApiProperty({
    description:
      "Weight in kg (if not provided, will be calculated from order)",
    example: 1.5,
    minimum: 0.1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Weight must be a number" })
  @Min(0.1, { message: "Weight must be at least 0.1 kg" })
  weight?: number;
}

export class GenerateLabelResponseDto {
  @ApiProperty({
    description: "Shipment ID from Shiprocket",
    example: 12345678,
  })
  shipmentId: number;

  @ApiProperty({
    description: "AWB (Airway Bill) number",
    example: "AWB123456789",
  })
  awbNumber: string;

  @ApiProperty({
    description: "Tracking number",
    example: "SR123456789",
  })
  trackingNumber: string;

  @ApiProperty({
    description: "Label PDF URL",
    example: "https://shiprocket.s3.amazonaws.com/labels/label_12345678.pdf",
  })
  labelUrl: string;

  @ApiProperty({
    description: "Shipment status",
    example: "label_generated",
  })
  status: string;

  @ApiProperty({
    description: "Message regarding label generation",
    example: "Label generated successfully",
  })
  message: string;
}
