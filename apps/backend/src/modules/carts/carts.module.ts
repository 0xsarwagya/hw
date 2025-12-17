import { Module } from "@nestjs/common";
import { BundlesModule } from "../bundles/bundles.module";
import { DiscountsModule } from "../discounts/discounts.module";
import { PricingModule } from "../pricing/pricing.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";

@Module({
  imports: [DiscountsModule, RedisStoreModule, BundlesModule, PricingModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
