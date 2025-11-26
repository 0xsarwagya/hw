import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayConfigService],
  exports: [PaymentsService, RazorpayConfigService],
})
export class PaymentsModule {}
