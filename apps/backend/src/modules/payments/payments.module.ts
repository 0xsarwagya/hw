import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayConfigService],
  exports: [PaymentsService, RazorpayConfigService],
})
export class PaymentsModule {}
