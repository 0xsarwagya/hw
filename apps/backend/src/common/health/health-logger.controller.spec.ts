import { Test, TestingModule } from "@nestjs/testing";
import { HealthLoggerController } from "./health-logger.controller";
import { ContextService } from "../logging/context.service";
import { PinoLogger } from "nestjs-pino";

describe("HealthLoggerController", () => {
  let controller: HealthLoggerController;
  let contextService: ContextService;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    mockLogger = {
      logger: {
        level: "info",
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthLoggerController],
      providers: [
        ContextService,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<HealthLoggerController>(HealthLoggerController);
    contextService = module.get<ContextService>(ContextService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getLoggingHealth", () => {
    it("should return logging health status", () => {
      const result = controller.getLoggingHealth();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("logger");
      expect(result).toHaveProperty("contextService");
      expect(result).toHaveProperty("redaction");
      expect(result.logger.status).toBe("OK");
      expect(result.contextService.status).toBe("OK");
    });

    it("should include logger level", () => {
      const result = controller.getLoggingHealth();

      expect(result.logger).toHaveProperty("level");
      expect(result.logger.level).toBe("info");
    });

    it("should include service name", () => {
      const result = controller.getLoggingHealth();

      expect(result.logger).toHaveProperty("service");
      expect(result.logger.service).toBe("vcecom-backend");
    });

    it("should include redaction configuration", () => {
      const result = controller.getLoggingHealth();

      expect(result.redaction).toHaveProperty("enabled");
      expect(result.redaction.enabled).toBe(true);
      expect(result.redaction).toHaveProperty("paths");
      expect(Array.isArray(result.redaction.paths)).toBe(true);
    });
  });
});

