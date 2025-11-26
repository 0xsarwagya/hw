import { Test, TestingModule } from "@nestjs/testing";
import { ShippingModule } from "./shipping.module";
import { ShippingController } from "./shipping.controller";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";
import { NimbusPostService } from "./nimbus-post.service";
import { NimbusPostConfigService } from "./nimbus-post-config.service";

describe("ShippingModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ShippingModule],
    }).compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide ShippingController", () => {
    const controller = module.get<ShippingController>(ShippingController);
    expect(controller).toBeDefined();
  });

  it("should provide ShiprocketService", () => {
    const service = module.get<ShiprocketService>(ShiprocketService);
    expect(service).toBeDefined();
  });

  it("should provide ShiprocketConfigService", () => {
    const configService = module.get<ShiprocketConfigService>(
      ShiprocketConfigService,
    );
    expect(configService).toBeDefined();
  });

  it("should provide NimbusPostService", () => {
    const service = module.get<NimbusPostService>(NimbusPostService);
    expect(service).toBeDefined();
  });

  it("should provide NimbusPostConfigService", () => {
    const configService = module.get<NimbusPostConfigService>(
      NimbusPostConfigService,
    );
    expect(configService).toBeDefined();
  });

  it("should export ShiprocketService", () => {
    const service = module.get<ShiprocketService>(ShiprocketService);
    expect(service).toBeDefined();
  });

  it("should export ShiprocketConfigService", () => {
    const configService = module.get<ShiprocketConfigService>(
      ShiprocketConfigService,
    );
    expect(configService).toBeDefined();
  });

  it("should export NimbusPostService", () => {
    const service = module.get<NimbusPostService>(NimbusPostService);
    expect(service).toBeDefined();
  });

  it("should export NimbusPostConfigService", () => {
    const configService = module.get<NimbusPostConfigService>(
      NimbusPostConfigService,
    );
    expect(configService).toBeDefined();
  });
});

