import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { MediaConsistencyService } from "./media-consistency.service";

/**
 * Media Consistency Worker
 * Runs nightly maintenance to fix media consistency issues
 */
@Injectable()
export class MediaConsistencyWorker implements OnModuleInit {
  constructor(
    private readonly consistencyService: MediaConsistencyService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  async onModuleInit() {
    this.logger.info(
      createLogContext(this.contextService, "onModuleInit", {}),
      "Media consistency worker initialized",
    );
  }

  /**
   * Nightly maintenance job
   * Runs at 3 AM daily
   */
  @Cron("0 3 * * *")
  async handleNightlyMaintenance() {
    this.logger.info(
      createLogContext(this.contextService, "handleNightlyMaintenance", {}),
      "Starting nightly media consistency maintenance",
    );

    try {
      // Run full scan first
      const scanResult = await this.consistencyService.scanAllIssues();

      this.logger.info(
        createLogContext(this.contextService, "handleNightlyMaintenance", {
          totalIssues: scanResult.issues.length,
          stats: scanResult.stats,
        }),
        "Media consistency scan completed",
      );

      // Auto-fix orphan images
      if (scanResult.stats.orphanImages > 0) {
        try {
          const orphanFixes =
            await this.consistencyService.fixOrphanImages("system");
          this.logger.info(
            createLogContext(this.contextService, "handleNightlyMaintenance", {
              fixed: orphanFixes.filter((f) => f.success).length,
              errors: orphanFixes.filter((f) => !f.success).length,
            }),
            "Orphan image cleanup completed",
          );
        } catch (error) {
          this.logger.error(
            createErrorContext(
              this.contextService,
              "handleNightlyMaintenance",
              error,
            ),
            "Failed to fix orphan images",
          );
        }
      }

      // Auto-fix order drift
      if (scanResult.stats.orderIndexIssues > 0) {
        try {
          const orderFixes =
            await this.consistencyService.fixOrderIndexes("system");
          this.logger.info(
            createLogContext(this.contextService, "handleNightlyMaintenance", {
              fixed: orderFixes.filter((f) => f.success).length,
              errors: orderFixes.filter((f) => !f.success).length,
            }),
            "Order index fix completed",
          );
        } catch (error) {
          this.logger.error(
            createErrorContext(
              this.contextService,
              "handleNightlyMaintenance",
              error,
            ),
            "Failed to fix order indexes",
          );
        }
      }

      this.logger.info(
        createLogContext(this.contextService, "handleNightlyMaintenance", {}),
        "Nightly media consistency maintenance completed",
      );
    } catch (error) {
      // Don't throw - maintenance failures shouldn't break the app
      this.logger.error(
        createErrorContext(
          this.contextService,
          "handleNightlyMaintenance",
          error,
        ),
        "Failed to run nightly media consistency maintenance",
      );
    }
  }
}
