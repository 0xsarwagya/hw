import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProductsModule } from "../products/products.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { AdminInventoryController } from "./admin-inventory.controller";
import { AdminInventoryService } from "./admin-inventory.service";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [RedisStoreModule, ProductsModule, NotificationsModule],
  controllers: [AdminInventoryController],
  providers: [InventoryService, AdminInventoryService],
  exports: [AdminInventoryService],
})
export class InventoryModule {}
