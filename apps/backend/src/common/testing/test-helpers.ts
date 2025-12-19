import { Provider } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppConfigService } from "../config/app.config.service";
import { ContextService } from "../logging/context.service";

/**
 * Common test providers for services that require PinoLogger, ContextService, and AppConfigService
 */
export const getCommonTestProviders = (): Provider[] => [
  ContextService,
  AppConfigService,
  {
    provide: PinoLogger,
    useValue: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      logger: {
        level: "info",
        child: jest.fn().mockReturnThis(),
      },
    } as unknown as PinoLogger,
  },
];

/**
 * Mock PinoLogger for testing
 */
export const createMockPinoLogger = () => {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    logger: {
      level: "info",
      child: jest.fn().mockReturnThis(),
    },
  } as unknown as jest.Mocked<PinoLogger>;
};

/**
 * Mock ContextService for testing
 */
export const createMockContextService = () => {
  return {
    run: jest.fn((context, fn) => fn()),
    get: jest.fn(),
    getValue: jest.fn(),
    setValue: jest.fn(),
    getRequestId: jest.fn(),
    getTraceId: jest.fn(),
    getSpanId: jest.fn(),
  } as unknown as jest.Mocked<ContextService>;
};
