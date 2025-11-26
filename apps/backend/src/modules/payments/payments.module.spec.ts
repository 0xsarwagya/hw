import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsModule } from "./payments.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";

describe("PaymentsModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PaymentsModule],
    }).compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide PaymentsController", () => {
    const controller = module.get<PaymentsController>(PaymentsController);
    expect(controller).toBeDefined();
  });

  it("should provide PaymentsService", () => {
    const service = module.get<PaymentsService>(PaymentsService);
    expect(service).toBeDefined();
  });

  it("should provide RazorpayConfigService", () => {
    const configService = module.get<RazorpayConfigService>(
      RazorpayConfigService,
    );
    expect(configService).toBeDefined();
  });

  it("should export PaymentsService", () => {
    const service = module.get<PaymentsService>(PaymentsService);
    expect(service).toBeDefined();
  });

  it("should export RazorpayConfigService", () => {
    const configService = module.get<RazorpayConfigService>(
      RazorpayConfigService,
    );
    expect(configService).toBeDefined();
  });
});

