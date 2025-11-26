import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class VerifyPaymentDto {
  @ApiProperty({
    description: "Razorpay order ID",
    example: "order_MNOPQRSTUVWXYZ",
  })
  @IsString({ message: "Razorpay order ID must be a string" })
  @IsNotEmpty({ message: "Razorpay order ID is required" })
  razorpay_order_id: string;

  @ApiProperty({
    description: "Razorpay payment ID",
    example: "pay_MNOPQRSTUVWXYZ",
  })
  @IsString({ message: "Razorpay payment ID must be a string" })
  @IsNotEmpty({ message: "Razorpay payment ID is required" })
  razorpay_payment_id: string;

  @ApiProperty({
    description: "Razorpay signature for verification",
    example: "abc123def456...",
  })
  @IsString({ message: "Razorpay signature must be a string" })
  @IsNotEmpty({ message: "Razorpay signature is required" })
  @Matches(/^[a-f0-9]{64}$/i, {
    message:
      "Razorpay signature must be a valid 64-character hexadecimal string",
  })
  razorpay_signature: string;
}

export class PaymentVerificationResponseDto {
  @ApiProperty({
    description: "Verification status",
    example: true,
  })
  verified: boolean;

  @ApiProperty({
    description: "Message",
    example: "Payment verified successfully",
  })
  message: string;

  @ApiProperty({
    description: "Payment details",
    nullable: true,
  })
  payment?: {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    method: string;
  };
}
