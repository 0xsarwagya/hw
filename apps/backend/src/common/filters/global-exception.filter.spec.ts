import { Test, TestingModule } from "@nestjs/testing";
import { HttpException, HttpStatus } from "@nestjs/common";
import { ArgumentsHost } from "@nestjs/common";
import { Response } from "express";
import { GlobalExceptionFilter } from "./global-exception.filter";
import { ContextService } from "../logging/context.service";
import { ExtendedRequest, ExtendedResponse } from "../logging/types";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;
  let contextService: ContextService;
  let mockLogger: {
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    info: jest.Mock;
  };
  let mockResponse: jest.Mocked<ExtendedResponse>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      requestContext: undefined,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        ContextService,
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    contextService = module.get<ContextService>(ContextService);
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  describe("catch", () => {
    let mockRequest: Partial<ExtendedRequest>;
    let mockHost: ArgumentsHost;

    beforeEach(() => {
      mockRequest = {
        method: "GET",
        url: "/test",
        logger: mockLogger as any, // Attach logger to request
      };

      mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ArgumentsHost;
    });

    it("should handle HttpException", () => {
      const exception = new HttpException("Test error", HttpStatus.BAD_REQUEST);
      const context: any = { requestId: "test-id" };

      contextService.run(context, () => {
        filter.catch(exception, mockHost);
      });

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          requestId: "test-id",
        }),
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should handle non-HTTP exceptions", () => {
      const exception = new Error("Internal error");
      const context: any = { requestId: "test-id" };

      contextService.run(context, () => {
        filter.catch(exception, mockHost);
      });

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          requestId: "test-id",
        }),
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should log error with full context", () => {
      const exception = new Error("Test error");
      const context: any = {
        requestId: "test-id",
        customerId: "customer-123",
        cartId: "cart-456",
      };

      contextService.run(context, () => {
        filter.catch(exception, mockHost);
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: "test-id",
          customerId: "customer-123",
          cartId: "cart-456",
          error: expect.objectContaining({
            message: "Test error",
          }),
        }),
        "Unhandled exception",
      );
    });

    it("should not include stack trace in response", () => {
      const exception = new Error("Test error");
      const context: any = { requestId: "test-id" };

      contextService.run(context, () => {
        filter.catch(exception, mockHost);
      });

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).not.toHaveProperty("error.stack");
    });

    it("should include error name in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const exception = new Error("Test error");
      const context: any = { requestId: "test-id" };

      contextService.run(context, () => {
        filter.catch(exception, mockHost);
      });

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty("error");

      process.env.NODE_ENV = originalEnv;
    });
  });
});

