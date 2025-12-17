import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PinoLogger } from "nestjs-pino";
import { Public } from "../decorators/public.decorator";
import { ContextService } from "../logging/context.service";

@ApiTags("health")
@Controller("_health")
@Public()
export class HealthLoggerController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  @Get("logging")
  @ApiOperation({
    summary: "Logging health check",
    description:
      "Returns logging system status including Pino logger and context service",
  })
  @ApiResponse({
    status: 200,
    description: "Logging health status",
  })
  getLoggingHealth() {
    const logLevel = this.logger.logger.level;
    const isLoggerActive = this.logger.logger !== null;

    // Test context service
    const testContext = { requestId: "health-check" };
    let contextServiceStatus = "OK";
    try {
      this.contextService.run(testContext, () => {
        const retrieved = this.contextService.get();
        if (!retrieved || retrieved.requestId !== "health-check") {
          contextServiceStatus = "ERROR";
        }
      });
    } catch (error) {
      contextServiceStatus = "ERROR";
    }

    return {
      status: isLoggerActive && contextServiceStatus === "OK" ? "OK" : "ERROR",
      logger: {
        status: isLoggerActive ? "OK" : "ERROR",
        level: logLevel,
        service: "vcecom-backend",
      },
      contextService: {
        status: contextServiceStatus,
      },
      redaction: {
        enabled: true,
        paths: [
          "customer.email",
          "customer.phone",
          "payment.card_last4",
          "headers.authorization",
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
