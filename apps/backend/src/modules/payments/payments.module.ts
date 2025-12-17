import { forwardRef, Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";

@Module({
  imports: [RedisStoreModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayConfigService],
  exports: [PaymentsService, RazorpayConfigService],
})
export class PaymentsModule {}
