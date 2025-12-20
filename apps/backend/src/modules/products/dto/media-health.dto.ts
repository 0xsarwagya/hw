import { ApiProperty } from "@nestjs/swagger";

export class MediaIssueDto {
  @ApiProperty({ description: "Issue type" })
  type: string;

  @ApiProperty({ description: "Issue severity" })
  severity: string;

  @ApiProperty({ description: "Issue description" })
  description: string;

  @ApiProperty({ description: "Product ID", required: false })
  productId?: string;

  @ApiProperty({ description: "Variant ID", required: false })
  variantId?: string;

  @ApiProperty({ description: "Image ID", required: false })
  imageId?: string;

  @ApiProperty({ description: "Suggested fix", required: false })
  suggestedFix?: string;

  @ApiProperty({ description: "Additional metadata", required: false })
  metadata?: Record<string, unknown>;
}

export class MediaFixDto {
  @ApiProperty({ description: "Issue ID" })
  issueId: string;

  @ApiProperty({ description: "Issue type" })
  issueType: string;

  @ApiProperty({ description: "Action taken" })
  action: string;

  @ApiProperty({ description: "Product ID", required: false })
  productId?: string;

  @ApiProperty({ description: "Variant ID", required: false })
  variantId?: string;

  @ApiProperty({ description: "Image ID", required: false })
  imageId?: string;

  @ApiProperty({ description: "State before fix", required: false })
  beforeState?: Record<string, unknown>;

  @ApiProperty({ description: "State after fix", required: false })
  afterState?: Record<string, unknown>;

  @ApiProperty({ description: "Whether fix was successful" })
  success: boolean;

  @ApiProperty({ description: "Error message if fix failed", required: false })
  error?: string;
}

export class MediaHealthStatsDto {
  @ApiProperty({ description: "Total number of products" })
  totalProducts: number;

  @ApiProperty({ description: "Total number of variants" })
  totalVariants: number;

  @ApiProperty({ description: "Total number of images" })
  totalImages: number;

  @ApiProperty({ description: "Number of product images" })
  productImages: number;

  @ApiProperty({ description: "Number of variant images" })
  variantImages: number;

  @ApiProperty({ description: "Number of orphan images" })
  orphanImages: number;

  @ApiProperty({ description: "Number of order index issues" })
  orderIndexIssues: number;

  @ApiProperty({ description: "Number of S3 consistency issues" })
  s3ConsistencyIssues: number;

  @ApiProperty({ description: "Number of variant inheritance issues" })
  variantInheritanceIssues: number;

  @ApiProperty({ description: "Total number of issues" })
  totalIssues: number;
}

export class MediaHealthScanResponseDto {
  @ApiProperty({
    type: [MediaIssueDto],
    description: "List of detected issues",
  })
  issues: MediaIssueDto[];

  @ApiProperty({ type: MediaHealthStatsDto, description: "Health statistics" })
  stats: MediaHealthStatsDto;

  @ApiProperty({ description: "Timestamp of scan" })
  scannedAt: Date;
}

export class MediaHealthFixResponseDto {
  @ApiProperty({ type: [MediaFixDto], description: "List of applied fixes" })
  fixed: MediaFixDto[];

  @ApiProperty({ type: [String], description: "List of errors encountered" })
  errors: string[];

  @ApiProperty({
    description: "Fix statistics",
    example: {
      totalIssues: 10,
      fixedCount: 8,
      errorCount: 2,
    },
  })
  stats: {
    totalIssues: number;
    fixedCount: number;
    errorCount: number;
  };
}

export class MediaAuditLogResponseDto {
  @ApiProperty({ description: "Audit log ID" })
  id: string;

  @ApiProperty({ description: "Product ID", required: false })
  productId?: string;

  @ApiProperty({ description: "Variant ID", required: false })
  variantId?: string;

  @ApiProperty({ description: "Image ID", required: false })
  imageId?: string;

  @ApiProperty({ description: "Action performed" })
  action: string;

  @ApiProperty({ description: "Action details", required: false })
  details?: Record<string, unknown>;

  @ApiProperty({ description: "Who performed the action" })
  performedBy: string;

  @ApiProperty({ description: "When the action was performed" })
  createdAt: Date;
}
