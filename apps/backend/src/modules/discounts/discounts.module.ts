import { Module } from "@nestjs/common";
import {
  DiscountsController,
  PublicDiscountsController,
} from "./discounts.controller";
import { DiscountsService } from "./discounts.service";
import { DiscountValidationService } from "./discount-validation.service";

@Module({
  controllers: [DiscountsController, PublicDiscountsController],
  providers: [DiscountsService, DiscountValidationService],
  exports: [DiscountsService, DiscountValidationService],
})
export class DiscountsModule {}
