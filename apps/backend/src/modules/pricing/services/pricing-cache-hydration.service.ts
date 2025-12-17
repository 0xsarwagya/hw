import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PricingRebuilder } from "./pricing-rebuilder.service";

/**
 * Service for hydrating pricing caches on application startup
 * Ensures fresh Redis state even after Redis restart, container restart, or deployment
 */
@Injectable()
export class PricingCacheHydrationService implements OnModuleInit {
  private readonly logger = new Logger(PricingCacheHydrationService.name);

  constructor(private readonly rebuilder: PricingRebuilder) {}

  /**
   * Hydrate pricing caches on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log("Starting pricing cache hydration...");
      await this.hydrate();
      this.logger.log("Pricing cache hydration completed");
    } catch (error) {
      this.logger.error(
        `Failed to hydrate pricing caches: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - cache hydration failure shouldn't prevent app startup
    }
  }

  /**
   * Hydrate all pricing caches
   */
  async hydrate(): Promise<void> {
    this.logger.log("Hydrating pricing caches...");

    // Rebuild and activate pricing bundle
    await this.rebuilder.rebuildFromDb();
    this.logger.log("Hydrated pricing bundle");

    this.logger.log("Pricing cache hydration completed");
  }
}
