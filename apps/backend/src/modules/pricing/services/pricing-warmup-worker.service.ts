import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PricingRebuilder } from "./pricing-rebuilder.service";

/**
 * Warmup worker for pricing caches
 * Runs periodically to refresh pricing bundles before peak traffic
 */
@Injectable()
export class PricingWarmupWorker {
  private readonly logger = new Logger(PricingWarmupWorker.name);

  constructor(private readonly rebuilder: PricingRebuilder) {}

  /**
   * Warmup pricing caches
   * Runs every 10 minutes
   */
  @Cron("*/10 * * * *")
  async warmup(): Promise<void> {
    try {
      this.logger.debug("Starting pricing cache warmup...");
      await this.rebuilder.rebuildFromDb();
      this.logger.debug("Pricing cache warmup completed");
    } catch (error) {
      this.logger.error(
        `Pricing cache warmup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - warmup failures shouldn't break the app
    }
  }
}
