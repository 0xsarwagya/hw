import { Module } from "@nestjs/common";
import { CartsModule } from "../carts/carts.module";
import { DiscountsModule } from "../discounts/discounts.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CartsModule, DiscountsModule, RedisStoreModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
