import { Module } from "@nestjs/common";
import { NimbusPostService } from "./nimbus-post.service";
import { NimbusPostConfigService } from "./nimbus-post-config.service";
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
  ],
  exports: [
    ShiprocketService,
    ShiprocketConfigService,
    NimbusPostService,
    NimbusPostConfigService,
    ShippingRulesService,
  ],
})
export class ShippingModule {}
