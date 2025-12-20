import { Module } from "@nestjs/common";
import { NimbusPostService } from "./nimbus-post.service";
import { NimbusPostConfigService } from "./nimbus-post-config.service";
import { ShipmentsService } from "./services/shipments.service";
import { ShippingController } from "./shipping.controller";
import { ShippingRulesService } from "./shipping-rules.service";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";

@Module({
  controllers: [ShippingController],
  providers: [
    ShiprocketService,
    ShiprocketConfigService,
    NimbusPostService,
    NimbusPostConfigService,
    ShippingRulesService,
    ShipmentsService,
  ],
  exports: [
    ShiprocketService,
    ShiprocketConfigService,
    NimbusPostService,
    NimbusPostConfigService,
    ShippingRulesService,
    ShipmentsService,
  ],
})
export class ShippingModule {}
