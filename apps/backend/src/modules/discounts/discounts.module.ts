import { Module } from "@nestjs/common";
import {
  DiscountsController,
  PublicDiscountsController,
} from "./discounts.controller";
import { DiscountsService } from "./discounts.service";

@Module({
  controllers: [DiscountsController, PublicDiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
