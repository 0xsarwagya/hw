import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { CartResponseDto } from "../../carts/dto/cart-response.dto";

export class AdminQueryAbandonedCheckoutsDto {
  @ApiProperty({
    description: "Page number (1-indexed)",
    example: 1,
    default: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be greater than or equal to 1" })
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
    default: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be greater than or equal to 1" })
  @Max(100, { message: "Limit must be less than or equal to 100" })
  limit?: number = 10;

  @ApiProperty({
    description: "Filter by recoverable status (has payment intent)",
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  recoverable?: boolean;

  @ApiProperty({
    description: "Filter by whether cart has customer email",
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasEmail?: boolean;

  @ApiProperty({
    description: "Minimum cart value",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minValue?: number;
}

export interface AbandonedCheckoutResponse {
  id: string;
  cartId: string;
  customerId: string | null;
  sessionId: string | null;
  checkoutState: "CREATED" | "LOCKED";
  subtotal: number;
  gstAmount: number;
  discountCode: string | null;
  discountAmount: number;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    isIntraState: boolean;
  };
  total: number;
  items: CartResponseDto["items"];
  paymentIntentId: string | null;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export class PaginatedAbandonedCheckoutsResponseDto {
  @ApiProperty({
    description: "List of abandoned checkouts",
    type: Array,
  })
  data: AbandonedCheckoutResponse[];

  @ApiProperty({
    description: "Total number of abandoned checkouts",
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 5,
  })
  totalPages: number;
}

