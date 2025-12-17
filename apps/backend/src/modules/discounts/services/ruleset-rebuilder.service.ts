import { Injectable, Logger } from "@nestjs/common";
import { DiscountsService } from "../discounts.service";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountProfiler } from "./discount-profiler.service";
import { RulesetBundleService } from "./ruleset-bundle.service";

/**
 * Service for orchestrating atomic discount ruleset bundle rebuilds
 * Ensures zero-downtime hot reloads with atomic activation
 */
@Injectable()
export class RulesetRebuilder {
  private readonly logger = new Logger(RulesetRebuilder.name);

  constructor(
    private readonly discountsService: DiscountsService,
    private readonly bundleService: RulesetBundleService,
    private readonly profiler: DiscountProfiler,
  ) {}

  /**
   * Rebuild bundle from provided discounts and atomically activate it
   * This is the core hot-reload operation
   *
   * @param discounts - Discount rules to build bundle from
   * @returns New version number
   * @throws Error if bundle build or activation fails
   */
  async rebuildAndActivate(discounts: DiscountResponseDto[]): Promise<number> {
    const startTime = Date.now();

    try {
      // STEP 1: Build new bundle (does NOT increment version yet)
      this.logger.debug(
        `Building new bundle from ${discounts.length} discounts`,
      );
      const metadata = await this.bundleService.buildBundle(discounts);

      // STEP 2: Atomically activate bundle (increments version)
      // If this fails, bundle exists but is inactive (can retry)
      await this.bundleService.activateBundle(metadata.version);

      // STEP 3: Update profiler metadata
      this.profiler.updateBundleMetadata(
        metadata.version,
        metadata.rulesCount,
        metadata.bundleSizeKB,
      );
      this.profiler.recordHotReload(metadata.version);

      const rebuildTime = Date.now() - startTime;
      this.logger.log(
        `Successfully rebuilt and activated bundle v${metadata.version} in ${rebuildTime}ms`,
      );

      return metadata.version;
    } catch (error) {
      this.logger.error(
        `Failed to rebuild and activate bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // If bundle build failed, version was NOT incremented (old version stays active)
      // If activation failed, bundle exists but inactive (can retry activation)
      throw error;
    }
  }

  /**
   * Rebuild bundle from database (loads all active discounts first)
   * This is used for cache hydration and warmup
   *
   * @returns New version number
   */
  async rebuildFromDb(): Promise<number> {
    try {
      // Load all active discounts from DB
      const discounts = await this.discountsService.findAllUnpaginated();
      const now = new Date();

      // Filter active discounts
      const activeDiscounts = discounts.filter((d) => {
        if (!d.isActive) {
          return false;
        }
        if (d.startDate > now) {
          return false; // Not started yet
        }
        if (d.endDate && d.endDate < now) {
          return false; // Expired
        }
        return true;
      });

      this.logger.debug(
        `Loaded ${activeDiscounts.length} active discounts from DB`,
      );

      if (activeDiscounts.length === 0) {
        this.logger.warn("No active discounts found, skipping rebuild");
        // Still create an empty bundle to maintain version consistency
        return this.rebuildAndActivate([]);
      }

      return this.rebuildAndActivate(activeDiscounts);
    } catch (error) {
      this.logger.error(
        `Failed to rebuild bundle from DB: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
