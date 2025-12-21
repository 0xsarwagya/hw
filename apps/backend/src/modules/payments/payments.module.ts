import { forwardRef, Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { AdminPaymentsController } from "./admin-payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";
import { PaymentChargeService } from "./services/payment-charge.service";
import { PaymentFeeAuditService } from "./services/payment-fee-audit.service";
import { StorePaymentsController } from "./store-payments.controller";

@Module({
  imports: [RedisStoreModule, forwardRef(() => OrdersModule)],
  controllers: [AdminPaymentsController, StorePaymentsController],
  providers: [
    PaymentsService,
    RazorpayConfigService,
    PaymentChargeService,
    PaymentFeeAuditService,
  ],
  exports: [
    PaymentsService,
    RazorpayConfigService,
    PaymentChargeService,
    PaymentFeeAuditService,
  ],
})
export class PaymentsModule {}
