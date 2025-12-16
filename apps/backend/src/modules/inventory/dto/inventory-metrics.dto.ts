import { ApiProperty } from "@nestjs/swagger";

export class InventoryMetricsDto {
  @ApiProperty({
    description: "Total available inventory across all variants",
    example: 1000,
  })
  available: number;

  @ApiProperty({
    description: "Total reserved inventory across all variants",
    example: 150,
  })
  reserved: number;

  @ApiProperty({
    description: "Percentage of inventory that is reserved",
    example: 13.04,
  })
  reserved_ratio: number;

  @ApiProperty({
    description: "Count of expired reservation keys found",
    example: 5,
  })
  expired_reservations_count: number;

  @ApiProperty({
    description: "Count of failed reservation attempts",
    example: 2,
  })
  failed_reservations: number;
}
