import { ApiProperty } from "@nestjs/swagger";

export class ActiveReservationDto {
  @ApiProperty({
    description: "Cart ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  cartId: string;

  @ApiProperty({
    description: "Reserved quantity",
    example: 2,
  })
  qty: number;

  @ApiProperty({
    description: "Reservation expiration timestamp",
    example: "2025-01-15T11:00:00Z",
  })
  expiresAt: Date;
}

export class InventoryReservationsResponseDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Total reserved quantity",
    example: 12,
  })
  reserved: number;

  @ApiProperty({
    description: "Number of expired reservations",
    example: 1,
  })
  expired: number;

  @ApiProperty({
    description: "List of active reservations",
    type: [ActiveReservationDto],
  })
  activeReservations: ActiveReservationDto[];
}

export class ReservationSummaryItemDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Committed/reserved quantity",
    example: 15,
  })
  committed: number;
}

export class ReservationsSummaryResponseDto {
  @ApiProperty({
    description: "Total committed inventory across all variants",
    example: 150,
  })
  totalCommitted: number;

  @ApiProperty({
    description: "Number of variants with committed inventory",
    example: 25,
  })
  variantCount: number;

  @ApiProperty({
    description: "List of variants with committed inventory",
    type: [ReservationSummaryItemDto],
  })
  variants: ReservationSummaryItemDto[];
}
