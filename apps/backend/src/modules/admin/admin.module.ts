import { Module } from "@nestjs/common";
import { CartsModule } from "../carts/carts.module";
import { OrdersModule } from "../orders/orders.module";
import { ProductsModule } from "../products/products.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminActivityLogsController } from "./admin-activity-logs.controller";
import { AdminActivityLogsService } from "./admin-activity-logs.service";

@Module({
  imports: [ProductsModule, CartsModule, RedisStoreModule, OrdersModule],
  controllers: [AdminController, AdminActivityLogsController],
  providers: [AdminService, AdminActivityLogsService],
  exports: [AdminService],
})
export class AdminModule {}
