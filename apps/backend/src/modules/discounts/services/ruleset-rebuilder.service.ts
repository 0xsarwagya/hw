import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { DiscountsService } from "../discounts.service";
import { DiscountApplicationType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountProfiler } from "./discount-profiler.service";
import { RulesetBundleService } from "./ruleset-bundle.service";

/**
 * Service for orchestrating atomic discount ruleset bundle rebuilds
 * Ensures zero-downtime hot reloads with atomic activation
 */
@Injectable()
export class RulesetRebuilder {
  constructor(
    @Inject(forwardRef(() => DiscountsService))
    private readonly discountsService: DiscountsService,
    private readonly bundleService: RulesetBundleService,
    private readonly profiler: DiscountProfiler,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
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
        createLogContext(this.contextService, "rebuildAndActivate", {
          discountCount: discounts.length,
        }),
        "Building new bundle",
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
      this.logger.info(
        createLogContext(this.contextService, "rebuildAndActivate", {
          version: metadata.version,
          rebuildTimeMs: rebuildTime,
        }),
        "Successfully rebuilt and activated bundle",
      );

      return metadata.version;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "rebuildAndActivate", error, {
          discountCount: discounts.length,
        }),
        "Failed to rebuild and activate bundle",
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

      // Filter active AUTOMATIC discounts only
      // MANUAL discounts should only be applied when code is entered
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
        // Only include AUTOMATIC discounts in the bundle
        // MANUAL discounts are validated separately when codes are entered
        if (d.applicationType !== DiscountApplicationType.AUTOMATIC) {
          return false;
        }
        return true;
      });

      this.logger.debug(
        createLogContext(this.contextService, "rebuildFromDb", {
          activeDiscountCount: activeDiscounts.length,
        }),
        "Loaded active discounts from DB",
      );

      if (activeDiscounts.length === 0) {
        this.logger.warn(
          createLogContext(this.contextService, "rebuildFromDb", {}),
          "No active discounts found, skipping rebuild",
        );
        // Still create an empty bundle to maintain version consistency
        return this.rebuildAndActivate([]);
      }

      return this.rebuildAndActivate(activeDiscounts);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "rebuildFromDb", error),
        "Failed to rebuild bundle from DB",
      );
      throw error;
    }
  }
}
