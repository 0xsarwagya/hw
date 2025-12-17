import { forwardRef, Module } from "@nestjs/common";
import { CartsModule } from "../carts/carts.module";
import { DiscountsModule } from "../discounts/discounts.module";
import { PaymentsModule } from "../payments/payments.module";
import { PricingModule } from "../pricing/pricing.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { ReconciliationService } from "./reconciliation.service";

@Module({
  imports: [
    CartsModule,
    DiscountsModule,
    PricingModule,
    RedisStoreModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ReconciliationService],
  exports: [OrdersService, ReconciliationService],
})
export class OrdersModule {}
