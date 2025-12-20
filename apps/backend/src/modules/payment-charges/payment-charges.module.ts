import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { PaymentChargesController } from "./payment-charges.controller";
import { PaymentChargesService } from "./payment-charges.service";

@Module({
  imports: [PaymentsModule],
  controllers: [PaymentChargesController],
  providers: [PaymentChargesService],
  exports: [PaymentChargesService],
})
export class PaymentChargesModule {}
