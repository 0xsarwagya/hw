import { ApiProperty } from "@nestjs/swagger";

export class CustomerSegmentationDto {
  @ApiProperty({ description: "New customers count", example: 450 })
  newCustomers: number;

  @ApiProperty({ description: "Returning customers count", example: 150 })
  returningCustomers: number;

  @ApiProperty({ description: "New customer percentage", example: 75.0 })
  newCustomerPercentage: number;

  @ApiProperty({ description: "Returning customer percentage", example: 25.0 })
  returningCustomerPercentage: number;
}

export class CustomerRetentionDto {
  @ApiProperty({
    description: "Repeat purchase rate percentage",
    example: 35.5,
  })
  repeatPurchaseRate: number;

  @ApiProperty({
    description: "Average customer lifetime value",
    example: 7500.0,
  })
  averageClv: number;

  @ApiProperty({ description: "Customers with 2+ orders", example: 180 })
  customersWithMultipleOrders: number;
}

export class SupportMetricsDto {
  @ApiProperty({ description: "Total support tickets", example: 125 })
  totalTickets: number;

  @ApiProperty({ description: "Open tickets", example: 25 })
  openTickets: number;

  @ApiProperty({ description: "Resolved tickets", example: 95 })
  resolvedTickets: number;

  @ApiProperty({ description: "Average response time in hours", example: 2.5 })
  averageResponseTime: number;

  @ApiProperty({
    description: "Average resolution time in hours",
    example: 24.0,
  })
  averageResolutionTime: number;

  @ApiProperty({ description: "First response SLA percentage", example: 85.0 })
  firstResponseSla: number;
}

export class ReturnReasonDto {
  @ApiProperty({ description: "Return reason", example: "Wrong size" })
  reason: string;

  @ApiProperty({ description: "Count of returns", example: 25 })
  count: number;

  @ApiProperty({ description: "Percentage of total returns", example: 35.7 })
  percentage: number;
}

export class ComplaintTrendDto {
  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({ description: "Product title", example: "Sample Product" })
  productTitle: string;

  @ApiProperty({ description: "Complaint count", example: 15 })
  complaintCount: number;

  @ApiProperty({ description: "Complaint rate percentage", example: 5.2 })
  complaintRate: number;
}

export class ReviewSentimentDto {
  @ApiProperty({ description: "Average rating", example: 4.2 })
  averageRating: number;

  @ApiProperty({ description: "Total reviews", example: 320 })
  totalReviews: number;

  @ApiProperty({ description: "Positive reviews (4-5 stars)", example: 250 })
  positiveReviews: number;

  @ApiProperty({ description: "Negative reviews (1-2 stars)", example: 30 })
  negativeReviews: number;

  @ApiProperty({ description: "Neutral reviews (3 stars)", example: 40 })
  neutralReviews: number;

  @ApiProperty({ description: "Net Promoter Score", example: 45 })
  nps: number;
}

export class CustomerSupportDashboardResponseDto {
  @ApiProperty({ type: CustomerSegmentationDto })
  segmentation: CustomerSegmentationDto;

  @ApiProperty({ type: CustomerRetentionDto })
  retention: CustomerRetentionDto;

  @ApiProperty({ type: SupportMetricsDto })
  support: SupportMetricsDto;

  @ApiProperty({
    type: [ReturnReasonDto],
    description: "Top return reasons",
  })
  returnReasons: ReturnReasonDto[];

  @ApiProperty({
    type: [ComplaintTrendDto],
    description: "Product-specific complaint trends",
  })
  complaintTrends: ComplaintTrendDto[];

  @ApiProperty({ type: ReviewSentimentDto })
  reviewSentiment: ReviewSentimentDto;
}
