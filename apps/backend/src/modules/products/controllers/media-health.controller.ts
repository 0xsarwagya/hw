import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RateLimit } from "../../../common/decorators/rate-limit.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RATE_LIMIT_PRESETS } from "../../../common/rate-limiting/rate-limit.config";
import {
  MediaAuditLogResponseDto,
  MediaHealthFixResponseDto,
  MediaHealthScanResponseDto,
} from "../dto/media-health.dto";
import { MediaAuditService } from "../services/media-audit.service";
import { MediaConsistencyService } from "../services/media-consistency.service";

@ApiTags("admin")
@Controller("admin/media/health")
@Roles("admin")
@ApiBearerAuth("JWT-auth")
export class MediaHealthController {
  constructor(
    private readonly consistencyService: MediaConsistencyService,
    private readonly auditService: MediaAuditService,
  ) {}

  @Get("scan")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Scan for media consistency issues",
    description:
      "Run a comprehensive scan to detect all media consistency issues including orphan images, order index problems, S3 inconsistencies, and variant inheritance violations.",
  })
  @ApiResponse({
    status: 200,
    description: "Scan completed successfully",
    type: MediaHealthScanResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async scan(): Promise<MediaHealthScanResponseDto> {
    const result = await this.consistencyService.scanAllIssues();
    return {
      issues: result.issues.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        productId: issue.productId,
        variantId: issue.variantId,
        imageId: issue.imageId,
        suggestedFix: issue.suggestedFix,
        metadata: issue.metadata,
      })),
      stats: result.stats,
      scannedAt: result.scannedAt,
    };
  }

  @Post("fix/order")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Fix order index errors",
    description:
      "Reorder all product and variant images sequentially to fix gaps and collisions.",
  })
  @ApiResponse({
    status: 200,
    description: "Order fixes applied",
    type: MediaHealthFixResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async fixOrder(
    @Query("performedBy") performedBy?: string,
  ): Promise<MediaHealthFixResponseDto> {
    const performer = performedBy || "system";
    const result = await this.consistencyService.fixOrderIndexes(performer);
    return {
      fixed: result.map((fix) => ({
        issueId: fix.issueId,
        issueType: fix.issueType,
        action: fix.action,
        productId: fix.productId,
        variantId: fix.variantId,
        imageId: fix.imageId,
        beforeState: fix.beforeState,
        afterState: fix.afterState,
        success: fix.success,
        error: fix.error,
      })),
      errors: [],
      stats: {
        totalIssues: result.length,
        fixedCount: result.filter((f) => f.success).length,
        errorCount: result.filter((f) => !f.success).length,
      },
    };
  }

  @Post("fix/orphans")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Fix orphan images",
    description:
      "Delete images that reference non-existent products or variants, and clean up their S3 files.",
  })
  @ApiResponse({
    status: 200,
    description: "Orphan fixes applied",
    type: MediaHealthFixResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async fixOrphans(
    @Query("performedBy") performedBy?: string,
  ): Promise<MediaHealthFixResponseDto> {
    const performer = performedBy || "system";
    const result = await this.consistencyService.fixOrphanImages(performer);
    return {
      fixed: result.map((fix) => ({
        issueId: fix.issueId,
        issueType: fix.issueType,
        action: fix.action,
        productId: fix.productId,
        variantId: fix.variantId,
        imageId: fix.imageId,
        beforeState: fix.beforeState,
        afterState: fix.afterState,
        success: fix.success,
        error: fix.error,
      })),
      errors: [],
      stats: {
        totalIssues: result.length,
        fixedCount: result.filter((f) => f.success).length,
        errorCount: result.filter((f) => !f.success).length,
      },
    };
  }

  @Post("fix/inheritance")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Fix variant inheritance violations",
    description:
      "Fix variant image inheritance rule violations (currently logs violations).",
  })
  @ApiResponse({
    status: 200,
    description: "Inheritance fixes applied",
    type: MediaHealthFixResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async fixInheritance(
    @Query("performedBy") performedBy?: string,
  ): Promise<MediaHealthFixResponseDto> {
    const performer = performedBy || "system";
    const result =
      await this.consistencyService.fixVariantInheritance(performer);
    return {
      fixed: result.map((fix) => ({
        issueId: fix.issueId,
        issueType: fix.issueType,
        action: fix.action,
        productId: fix.productId,
        variantId: fix.variantId,
        imageId: fix.imageId,
        beforeState: fix.beforeState,
        afterState: fix.afterState,
        success: fix.success,
        error: fix.error,
      })),
      errors: [],
      stats: {
        totalIssues: result.length,
        fixedCount: result.filter((f) => f.success).length,
        errorCount: result.filter((f) => !f.success).length,
      },
    };
  }

  @Post("fix/s3")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Fix S3 orphan files",
    description:
      "Clean up orphaned S3 files that don't have corresponding database records.",
  })
  @ApiResponse({
    status: 200,
    description: "S3 fixes applied",
    type: MediaHealthFixResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async fixS3(
    @Query("performedBy") performedBy?: string,
  ): Promise<MediaHealthFixResponseDto> {
    const performer = performedBy || "system";
    const result = await this.consistencyService.fixS3Orphans(performer);
    return {
      fixed: result.map((fix) => ({
        issueId: fix.issueId,
        issueType: fix.issueType,
        action: fix.action,
        productId: fix.productId,
        variantId: fix.variantId,
        imageId: fix.imageId,
        beforeState: fix.beforeState,
        afterState: fix.afterState,
        success: fix.success,
        error: fix.error,
      })),
      errors: [],
      stats: {
        totalIssues: result.length,
        fixedCount: result.filter((f) => f.success).length,
        errorCount: result.filter((f) => !f.success).length,
      },
    };
  }

  @Post("fix/all")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Fix all media issues",
    description:
      "Run all fix operations in sequence: orphan cleanup, order reindexing, inheritance fixes, and S3 cleanup.",
  })
  @ApiResponse({
    status: 200,
    description: "All fixes applied",
    type: MediaHealthFixResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async fixAll(
    @Query("performedBy") performedBy?: string,
  ): Promise<MediaHealthFixResponseDto> {
    const performer = performedBy || "system";
    const result = await this.consistencyService.fixAll(performer);
    return {
      fixed: result.fixed.map((fix) => ({
        issueId: fix.issueId,
        issueType: fix.issueType,
        action: fix.action,
        productId: fix.productId,
        variantId: fix.variantId,
        imageId: fix.imageId,
        beforeState: fix.beforeState,
        afterState: fix.afterState,
        success: fix.success,
        error: fix.error,
      })),
      errors: result.errors,
      stats: result.stats,
    };
  }

  @Get("audit-logs")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get media audit logs",
    description: "Retrieve audit logs for media consistency operations.",
  })
  @ApiQuery({ name: "productId", required: false, type: String })
  @ApiQuery({ name: "variantId", required: false, type: String })
  @ApiQuery({ name: "imageId", required: false, type: String })
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved",
    type: [MediaAuditLogResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getAuditLogs(
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("imageId") imageId?: string,
    @Query("action") action?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ): Promise<MediaAuditLogResponseDto[]> {
    const logs = await this.auditService.getAuditLogs({
      productId,
      variantId,
      imageId,
      action,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return logs.map((log) => ({
      id: log.id,
      productId: log.productId || undefined,
      variantId: log.variantId || undefined,
      imageId: log.imageId || undefined,
      action: log.action,
      details: log.details as Record<string, unknown> | undefined,
      performedBy: log.performedBy,
      createdAt: log.createdAt,
    }));
  }
}
