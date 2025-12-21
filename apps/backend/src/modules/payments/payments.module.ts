import { forwardRef, Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";
import { PaymentChargeService } from "./services/payment-charge.service";
import { PaymentFeeAuditService } from "./services/payment-fee-audit.service";

@Module({
  imports: [RedisStoreModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
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
