import { ApiProperty } from "@nestjs/swagger";
import { PaymentIntent } from "../../redis-store/dto/payment-intent.dto";

export class PaymentIntentResponseDto {
  @ApiProperty({
    description: "Payment intent details (null for COD orders)",
    type: Object,
    required: false,
    nullable: true,
  })
  paymentIntent: PaymentIntent | null = null;

  @ApiProperty({
    description: "Checkout session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  checkoutSessionId: string;

  @ApiProperty({
    description: "Message indicating the next steps",
    example: "Payment intent created. Redirect user to payment gateway.",
  })
  message: string;

  @ApiProperty({
    description: "Order ID (only present for COD orders)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  orderId?: string;
}
