import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response, NextFunction } from "express";
import { ContextMiddleware } from "./context.middleware";
import { ContextService } from "./context.service";
import { PinoLogger } from "nestjs-pino";

describe("ContextMiddleware", () => {
  let middleware: ContextMiddleware;
  let contextService: ContextService;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    mockLogger = {
      logger: {
        child: jest.fn().mockReturnValue({
          info: jest.fn(),
        }),
      } as any,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextMiddleware,
        ContextService,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    middleware = module.get<ContextMiddleware>(ContextMiddleware);
    contextService = module.get<ContextService>(ContextService);
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  it("should generate requestId if not present in headers", () => {
    const req = {
      headers: {},
      url: "/test",
      method: "GET",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    // Context is set inside the run() callback, so we check after next() is called
    // The requestId should be stored in the response context
    expect((res as any).requestContext?.requestId).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("should use requestId from headers if present", () => {
    const req = {
      headers: { "x-request-id": "custom-request-id" },
      url: "/test",
      method: "GET",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect((res as any).requestContext?.requestId).toBe("custom-request-id");
    expect(next).toHaveBeenCalled();
  });

  it("should extract correlationId from headers", () => {
    const req = {
      headers: { "x-correlation-id": "correlation-123" },
      url: "/test",
      method: "GET",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect((res as any).requestContext?.correlationId).toBe("correlation-123");
    expect(next).toHaveBeenCalled();
  });

  it("should extract IP address", () => {
    const req = {
      headers: {},
      url: "/test",
      method: "GET",
      socket: { remoteAddress: "192.168.1.1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect((res as any).requestContext?.ip).toBe("192.168.1.1");
    expect(next).toHaveBeenCalled();
  });

  it("should create child logger with context", () => {
    const req = {
      headers: { "x-request-id": "test-id" },
      url: "/test",
      method: "GET",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(mockLogger.logger.child).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "test-id",
      }),
    );
    expect(next).toHaveBeenCalled();
  });
});

