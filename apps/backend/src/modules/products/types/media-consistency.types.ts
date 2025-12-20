/**
 * Media consistency issue types
 */

export type MediaIssueType =
  | "orphan_image"
  | "order_index_gap"
  | "order_index_collision"
  | "s3_missing_file"
  | "s3_orphan_file"
  | "variant_inheritance_violation";

export type MediaIssueSeverity = "info" | "warning" | "error" | "critical";

export interface MediaIssue {
  type: MediaIssueType;
  severity: MediaIssueSeverity;
  description: string;
  productId?: string;
  variantId?: string;
  imageId?: string;
  suggestedFix?: string;
  metadata?: Record<string, unknown>;
}

export interface OrphanImageIssue extends MediaIssue {
  type: "orphan_image";
  reason: "missing_product" | "missing_variant" | "both_null";
}

export interface OrderIndexIssue extends MediaIssue {
  type: "order_index_gap" | "order_index_collision";
  expectedOrder?: number;
  actualOrder?: number;
  conflictingImageIds?: string[];
}

export interface S3ConsistencyIssue extends MediaIssue {
  type: "s3_missing_file" | "s3_orphan_file";
  s3Key?: string;
  fileExists?: boolean;
  recordExists?: boolean;
}

export interface VariantInheritanceIssue extends MediaIssue {
  type: "variant_inheritance_violation";
  mode: "inherit" | "custom";
  violation:
    | "has_custom_images_in_inherit_mode"
    | "missing_images_in_custom_mode";
}

export interface MediaFix {
  issueId: string;
  issueType: MediaIssueType;
  action: string;
  productId?: string;
  variantId?: string;
  imageId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

export interface MediaHealthStats {
  totalProducts: number;
  totalVariants: number;
  totalImages: number;
  productImages: number;
  variantImages: number;
  orphanImages: number;
  orderIndexIssues: number;
  s3ConsistencyIssues: number;
  variantInheritanceIssues: number;
  totalIssues: number;
}

export interface MediaHealthScanResult {
  issues: MediaIssue[];
  stats: MediaHealthStats;
  scannedAt: Date;
}

export interface MediaHealthFixResult {
  fixed: MediaFix[];
  errors: string[];
  stats: {
    totalIssues: number;
    fixedCount: number;
    errorCount: number;
  };
}
