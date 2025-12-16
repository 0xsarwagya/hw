import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
