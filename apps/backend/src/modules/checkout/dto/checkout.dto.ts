import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
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

export class StartCheckoutDto {
  @ApiProperty({
    description: "Cart ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  cartId: string;

  @ApiProperty({
    description: "Guest email (optional, for guest checkout)",
    example: "guest@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}

export class CheckoutAddressDto {
  @ApiProperty({
    description: "Checkout session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  checkoutSessionId: string;

  @ApiProperty({
    description: "Name",
    example: "John Doe",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: "Email",
    example: "customer@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Phone",
    example: "+919876543210",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: "Address line 1",
    example: "123 Main St",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  address1: string;

  @ApiProperty({
    description: "Address line 2",
    example: "Apt 4B",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiProperty({
    description: "City",
    example: "Mumbai",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: "State",
    example: "Maharashtra",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: "PIN code",
    example: "400001",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  pincode: string;

  @ApiProperty({
    description: "Country",
    example: "India",
    default: "India",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class CheckoutShippingDto {
  @ApiProperty({
    description: "Checkout session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  checkoutSessionId: string;

  @ApiProperty({
    description: "Shipping method ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  shippingMethodId: string;
}

export class CheckoutConfirmDto {
  @ApiProperty({
    description: "Checkout session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  checkoutSessionId: string;

  @ApiProperty({
    description: "Idempotency key (optional)",
    example: "unique-request-id-12345",
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export { PaymentMethodWithFeeDto };
