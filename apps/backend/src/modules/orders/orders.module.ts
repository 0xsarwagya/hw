import { forwardRef, Module } from "@nestjs/common";
import { BundlesModule } from "../bundles/bundles.module";
import { CartsModule } from "../carts/carts.module";
import { CustomersModule } from "../customers/customers.module";
import { DiscountsModule } from "../discounts/discounts.module";
import { PaymentsModule } from "../payments/payments.module";
import { PricingModule } from "../pricing/pricing.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { ReconciliationService } from "./reconciliation.service";
import { OrderGstService } from "./services/order-gst.service";
import { OrderPricingService } from "./services/order-pricing.service";
import { OrderStatusService } from "./services/order-status.service";
import { OrderTimelineService } from "./services/order-timeline.service";
import { OrderValidationService } from "./services/order-validation.service";

@Module({
  imports: [
    CartsModule,
    BundlesModule,
    DiscountsModule,
    PricingModule,
    RedisStoreModule,
    CustomersModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    ReconciliationService,
    OrderValidationService,
    OrderPricingService,
    OrderStatusService,
    OrderGstService,
    OrderTimelineService,
  ],
  exports: [
    OrdersService,
    ReconciliationService,
    OrderValidationService,
    OrderPricingService,
    OrderStatusService,
    OrderGstService,
    OrderTimelineService,
  ],
})
export class OrdersModule {}
