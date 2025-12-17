import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { BundlesController } from "./bundles.controller";
import { BundleDefinitionService } from "./services/bundle-definition.service";
import { BundleEligibilityService } from "./services/bundle-eligibility.service";
import { BundleSetItemsService } from "./services/bundle-set-items.service";
import { BundleSetsService } from "./services/bundle-sets.service";
import { BundleWarmupService } from "./services/bundle-warmup.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [BundlesController],
  providers: [
    BundleDefinitionService,
    BundleSetsService,
    BundleSetItemsService,
    BundleEligibilityService,
    BundleWarmupService,
  ],
  exports: [BundleDefinitionService, BundleEligibilityService],
})
export class BundlesModule {}
