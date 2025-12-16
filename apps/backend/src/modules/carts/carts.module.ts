import { Module } from "@nestjs/common";
import { DiscountsModule } from "../discounts/discounts.module";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";

@Module({
  imports: [DiscountsModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
