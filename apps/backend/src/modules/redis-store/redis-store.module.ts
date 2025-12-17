import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { RedisStoreService } from "./redis-store.service";
import { InventoryRecoveryService } from "./services/inventory-recovery.service";
import { BundleCacheStore } from "./stores/bundle-cache-store";
import { CartStore } from "./stores/cart-store";
import { CheckoutStore } from "./stores/checkout-store";
import { IdempotencyStore } from "./stores/idempotency-store";
import { InventoryStore } from "./stores/inventory-store";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    RedisStoreService,
    InventoryStore,
    CartStore,
    CheckoutStore,
    IdempotencyStore,
    InventoryRecoveryService,
    BundleCacheStore,
  ],
  exports: [
    RedisStoreService,
    InventoryStore,
    CartStore,
    CheckoutStore,
    IdempotencyStore,
    BundleCacheStore,
  ],
})
export class RedisStoreModule {}
