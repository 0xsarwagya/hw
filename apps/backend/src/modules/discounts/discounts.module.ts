import { Module } from "@nestjs/common";
import { DiscountValidationService } from "./discount-validation.service";
import {
  DiscountsController,
  PublicDiscountsController,
} from "./discounts.controller";
import { DiscountsService } from "./discounts.service";

@Module({
  controllers: [DiscountsController, PublicDiscountsController],
  providers: [DiscountsService, DiscountValidationService],
  exports: [DiscountsService, DiscountValidationService],
})
export class DiscountsModule {}
