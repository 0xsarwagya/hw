import { Module } from "@nestjs/common";
import { ShippingController } from "./shipping.controller";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";

@Module({
  controllers: [ShippingController],
  providers: [ShiprocketService, ShiprocketConfigService],
  exports: [ShiprocketService, ShiprocketConfigService],
})
export class ShippingModule {}
