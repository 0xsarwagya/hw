import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { PaymentMethodWithFeeDto } from "../../payments/dto/payment-charge.dto";

export class SelectPaymentMethodDto {
  @ApiProperty({
    description: "Payment method code",
    example: "COD",
  })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: "Checkout session ID (optional)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsUUID()
  checkoutSessionId?: string;
}

export { PaymentMethodWithFeeDto };
