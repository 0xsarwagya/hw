import { Module } from "@nestjs/common";
import { CartsModule } from "../carts/carts.module";
import { PaymentsModule } from "../payments/payments.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { CheckoutController } from "./checkout.controller";

@Module({
  imports: [CartsModule, PaymentsModule, RedisStoreModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
