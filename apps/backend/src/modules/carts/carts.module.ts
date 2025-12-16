import { Module } from "@nestjs/common";
import { DiscountsModule } from "../discounts/discounts.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";

@Module({
  imports: [DiscountsModule, RedisStoreModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
