import { Test, TestingModule } from "@nestjs/testing";
import { HealthTracingController } from "./health-tracing.controller";

describe("HealthTracingController", () => {
  let controller: HealthTracingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthTracingController],
    }).compile();

    controller = module.get<HealthTracingController>(HealthTracingController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getTracingHealth", () => {
    it("should return tracing health status", () => {
      const result = controller.getTracingHealth();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("enabled");
      expect(result).toHaveProperty("tracerProvider");
      expect(result).toHaveProperty("exporter");
      expect(result).toHaveProperty("sampling");
    });

    it("should include exporter configuration", () => {
      const result = controller.getTracingHealth();

      expect(result.exporter).toHaveProperty("type");
      expect(result.exporter.type).toBe("zipkin");
      expect(result.exporter).toHaveProperty("endpoint");
    });

    it("should include sampling rate", () => {
      const result = controller.getTracingHealth();

      expect(result.sampling).toHaveProperty("rate");
      expect(result.sampling).toHaveProperty("percentage");
      expect(typeof result.sampling.rate).toBe("number");
    });
  });
});

