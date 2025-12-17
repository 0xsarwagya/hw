import { ApiProperty } from "@nestjs/swagger";

export class ReviewAggregateDto {
  @ApiProperty({
    description: "Product variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Average rating (0-5)",
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  averageRating: number;

  @ApiProperty({
    description: "Total number of approved reviews",
    example: 150,
  })
  reviewCount: number;

  @ApiProperty({
    description: "Number of 1-star reviews",
    example: 5,
  })
  rating1Count: number;

  @ApiProperty({
    description: "Number of 2-star reviews",
    example: 10,
  })
  rating2Count: number;

  @ApiProperty({
    description: "Number of 3-star reviews",
    example: 20,
  })
  rating3Count: number;

  @ApiProperty({
    description: "Number of 4-star reviews",
    example: 50,
  })
  rating4Count: number;

  @ApiProperty({
    description: "Number of 5-star reviews",
    example: 65,
  })
  rating5Count: number;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  updatedAt: Date;
}
