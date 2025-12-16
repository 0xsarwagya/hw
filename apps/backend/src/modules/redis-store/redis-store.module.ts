import { Module } from "@nestjs/common";
import { RedisStoreService } from "./redis-store.service";
import { CartStore } from "./stores/cart-store";
import { CheckoutStore } from "./stores/checkout-store";
import { IdempotencyStore } from "./stores/idempotency-store";
import { InventoryStore } from "./stores/inventory-store";

@Module({
  providers: [
    RedisStoreService,
    InventoryStore,
    CartStore,
    CheckoutStore,
    IdempotencyStore,
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
