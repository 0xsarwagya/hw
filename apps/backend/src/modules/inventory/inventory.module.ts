import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { AdminInventoryController } from "./admin-inventory.controller";
import { AdminInventoryService } from "./admin-inventory.service";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [RedisStoreModule, ProductsModule],
  controllers: [InventoryController, AdminInventoryController],
  providers: [InventoryService, AdminInventoryService],
  exports: [AdminInventoryService],
})
export class InventoryModule {}
