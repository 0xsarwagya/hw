import { ApiProperty } from "@nestjs/swagger";

export class CancelShipmentResponseDto {
  @ApiProperty({
    description: "AWB number",
    example: "AWB123456789",
  })
  awbNumber: string;

  @ApiProperty({
    description: "Shipment status",
    example: "cancelled",
  })
  status: string;

  @ApiProperty({
    description: "Cancellation message",
    example: "Shipment cancelled successfully",
  })
  message: string;
}

