import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { StoresService } from "./stores.service";

@ApiTags("store")
@Controller("store/config")
@Public()
export class StorefrontConfigController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "Get store configuration",
    description:
      "Returns store configuration including currency, features, and other public settings (public endpoint)",
  })
  @ApiOkResponse({
    description: "Store configuration retrieved successfully",
    schema: {
      type: "object",
      properties: {
        currency: { type: "string", example: "INR" },
        name: { type: "string", example: "My Store" },
        domain: { type: "string", example: "mystore.com" },
        primaryColor: { type: "string", nullable: true },
        logoUrl: { type: "string", nullable: true },
        features: {
          type: "object",
          properties: {
            guestCheckout: { type: "boolean", example: true },
            cod: { type: "boolean", example: true },
            multiCurrency: { type: "boolean", example: false },
          },
        },
      },
    },
  })
  async getConfig() {
    const store = await this.storesService.getStore();
    return {
      currency: store.currency,
      name: store.name,
      domain: store.domain,
      primaryColor: store.primaryColor,
      logoUrl: store.logoUrl,
      features: {
        guestCheckout: true, // Always enabled
        cod: true, // Always enabled (can be made configurable)
        multiCurrency: false, // Can be made configurable
      },
    };
  }
}
