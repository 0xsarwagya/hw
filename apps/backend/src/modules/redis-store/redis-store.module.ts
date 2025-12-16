import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { RedisStoreService } from "./redis-store.service";
import { InventoryRecoveryService } from "./services/inventory-recovery.service";
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
  ],
  exports: [
    RedisStoreService,
    InventoryStore,
    CartStore,
    CheckoutStore,
    IdempotencyStore,
  ],
})
export class RedisStoreModule {}
