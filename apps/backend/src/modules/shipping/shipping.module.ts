import { Module } from "@nestjs/common";
import { NimbusPostService } from "./nimbus-post.service";
import { NimbusPostConfigService } from "./nimbus-post-config.service";
import { ShippingController } from "./shipping.controller";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";

@Module({
  controllers: [ShippingController],
  providers: [
    ShiprocketService,
    ShiprocketConfigService,
    NimbusPostService,
    NimbusPostConfigService,
  ],
  exports: [
    ShiprocketService,
    ShiprocketConfigService,
    NimbusPostService,
    NimbusPostConfigService,
  ],
})
export class ShippingModule {}
