import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { SystemLogsController } from "./system-logs.controller";
import { SystemLogsService } from "./system-logs.service";
import { SystemLogsStorageService } from "./system-logs-storage.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [SystemLogsController],
  providers: [SystemLogsService, SystemLogsStorageService],
  exports: [SystemLogsStorageService], // Export for use in interceptor
})
export class SystemLogsModule {}
