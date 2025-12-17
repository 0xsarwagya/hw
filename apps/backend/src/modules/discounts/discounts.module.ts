import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { DiscountValidationService } from "./discount-validation.service";
import {
  DiscountsController,
  PublicDiscountsController,
} from "./discounts.controller";
import { DiscountsService } from "./discounts.service";
import { AdminDriftReportService } from "./services/admin-drift-report.service";
import { DiscountAuditService } from "./services/discount-audit.service";
import { DiscountCacheHydrationService } from "./services/discount-cache-hydration.service";
import { DiscountEligibilityBuilder } from "./services/discount-eligibility-builder.service";
import { DiscountInvalidationService } from "./services/discount-invalidation.service";
import { DiscountProfiler } from "./services/discount-profiler.service";
import { DiscountSnapshotValidator } from "./services/discount-snapshot-validator.service";
import { DiscountWarmupWorker } from "./services/discount-warmup-worker.service";
import { DriftDetectorService } from "./services/drift-detector.service";
import { EligibilityChangeTracker } from "./services/eligibility-change-tracker.service";
import { HotReloadWatcher } from "./services/hot-reload-watcher.service";
import { ProductMappingBuilder } from "./services/product-mapping-builder.service";
import { RuleChangeTracker } from "./services/rule-change-tracker.service";
import { RulesetBundleService } from "./services/ruleset-bundle.service";
import { RulesetRebuilder } from "./services/ruleset-rebuilder.service";
import { RulesetVersionManager } from "./services/ruleset-version-manager.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [DiscountsController, PublicDiscountsController],
  providers: [
    DiscountsService,
    DiscountValidationService,
    DiscountCacheHydrationService,
    DiscountEligibilityBuilder,
    DiscountWarmupWorker,
    DiscountInvalidationService,
    ProductMappingBuilder,
    DiscountSnapshotValidator,
    DiscountAuditService,
    DriftDetectorService,
    RuleChangeTracker,
    EligibilityChangeTracker,
    AdminDriftReportService,
    RulesetVersionManager,
    RulesetBundleService,
    DiscountProfiler,
    HotReloadWatcher,
    RulesetRebuilder,
  ],
  exports: [
    DiscountsService,
    DiscountValidationService,
    DiscountInvalidationService,
    DiscountSnapshotValidator,
    DiscountAuditService,
    DriftDetectorService,
    RulesetVersionManager,
    RulesetBundleService,
    DiscountProfiler,
    HotReloadWatcher,
    RulesetRebuilder,
  ],
})
export class DiscountsModule {}
