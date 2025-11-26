import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RazorpayConfigDto {
  @ApiProperty({
    description: "Razorpay Key ID",
    example: "rzp_test_1234567890",
  })
  @IsString({ message: "Key ID must be a string" })
  @IsNotEmpty({ message: "Key ID is required" })
  keyId: string;

  @ApiProperty({
    description: "Razorpay Key Secret",
    example: "secret_1234567890",
  })
  @IsString({ message: "Key Secret must be a string" })
  @IsNotEmpty({ message: "Key Secret is required" })
  keySecret: string;
}

export class RazorpayConfigResponseDto {
  @ApiProperty({
    description: "Configuration status",
    example: true,
  })
  initialized: boolean;

  @ApiProperty({
    description: "Message",
    example: "Razorpay initialized successfully",
  })
  message: string;
}
