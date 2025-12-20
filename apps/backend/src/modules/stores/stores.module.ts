import { Module } from "@nestjs/common";
import { StoresController } from "./stores.controller";
import { StoresService } from "./stores.service";

@Module({
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService], // Export for use in other modules
})
export class StoresModule {}
