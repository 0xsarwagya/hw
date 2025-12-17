import { ContextService } from "../context.service";
import { createErrorContext, createLogContext } from "../logging.helper";

describe("Structured Logging Format", () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
  });

  describe("createLogContext", () => {
    it("should create structured log context with operation name", () => {
      const context = createLogContext(contextService, "testOperation", {});
      
      expect(context).toHaveProperty("operation", "testOperation");
      expect(context.requestId).toBeUndefined();
    });

    it("should include request-scoped context when available", () => {
      const requestContext = {
        requestId: "req-123",
        traceId: "trace-456",
        spanId: "span-789",
        customerId: "cust-abc",
        orderId: "order-xyz",
      };

      contextService.run(requestContext, () => {
        const context = createLogContext(contextService, "testOperation", {
          additionalField: "value",
        });

        expect(context).toHaveProperty("operation", "testOperation");
        expect(context).toHaveProperty("requestId", "req-123");
        expect(context).toHaveProperty("traceId", "trace-456");
        expect(context).toHaveProperty("spanId", "span-789");
        expect(context).toHaveProperty("customerId", "cust-abc");
        expect(context).toHaveProperty("orderId", "order-xyz");
        expect(context).toHaveProperty("additionalField", "value");
      });
    });

    it("should merge additional context fields", () => {
      const requestContext = {
        requestId: "req-123",
        customerId: "cust-abc",
      };

      contextService.run(requestContext, () => {
        const context = createLogContext(contextService, "createOrder", {
          orderId: "order-xyz",
          amount: 1000,
          currency: "USD",
        });

        expect(context).toHaveProperty("operation", "createOrder");
        expect(context).toHaveProperty("requestId", "req-123");
        expect(context).toHaveProperty("customerId", "cust-abc");
        expect(context).toHaveProperty("orderId", "order-xyz");
        expect(context).toHaveProperty("amount", 1000);
        expect(context).toHaveProperty("currency", "USD");
      });
    });
  });

  describe("createErrorContext", () => {
    it("should create error context with error details", () => {
      const error = new Error("Test error message");
      const context = createErrorContext(
        contextService,
        "testOperation",
        error,
        {},
      );

      expect(context).toHaveProperty("operation", "testOperation");
      expect(context).toHaveProperty("error", "Test error message");
      expect(context).toHaveProperty("errorType", "Error");
      expect(context).toHaveProperty("stack");
    });

    it("should include request-scoped context in error logs", () => {
      const requestContext = {
        requestId: "req-123",
        traceId: "trace-456",
        customerId: "cust-abc",
      };

      const error = new Error("Database connection failed");

      contextService.run(requestContext, () => {
        const context = createErrorContext(
          contextService,
          "createOrder",
          error,
          { orderId: "order-xyz" },
        );

        expect(context).toHaveProperty("operation", "createOrder");
        expect(context).toHaveProperty("error", "Database connection failed");
        expect(context).toHaveProperty("errorType", "Error");
        expect(context).toHaveProperty("requestId", "req-123");
        expect(context).toHaveProperty("traceId", "trace-456");
        expect(context).toHaveProperty("customerId", "cust-abc");
        expect(context).toHaveProperty("orderId", "order-xyz");
        expect(context).toHaveProperty("stack");
      });
    });

    it("should handle non-Error objects", () => {
      const error = "String error";
      const context = createErrorContext(
        contextService,
        "testOperation",
        error,
        {},
      );

      expect(context).toHaveProperty("operation", "testOperation");
      expect(context).toHaveProperty("error", "String error");
      expect(context).toHaveProperty("errorType", "Unknown");
      expect(context.stack).toBeUndefined();
    });

    it("should handle custom error types", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      const error = new CustomError("Custom error message");
      const context = createErrorContext(
        contextService,
        "testOperation",
        error,
        {},
      );

      expect(context).toHaveProperty("error", "Custom error message");
      expect(context).toHaveProperty("errorType", "CustomError");
    });
  });

  describe("Log Output Format", () => {
    it("should produce valid JSON structure for Pino", () => {
      const requestContext = {
        requestId: "req-123",
        traceId: "trace-456",
        customerId: "cust-abc",
        orderId: "order-xyz",
      };

      contextService.run(requestContext, () => {
        const logContext = createLogContext(contextService, "createOrder", {
          amount: 1000,
          currency: "USD",
        });

        // Verify structure is JSON-serializable
        const json = JSON.stringify(logContext);
        const parsed = JSON.parse(json);

        expect(parsed).toHaveProperty("operation");
        expect(parsed).toHaveProperty("requestId");
        expect(parsed).toHaveProperty("traceId");
        expect(parsed).toHaveProperty("customerId");
        expect(parsed).toHaveProperty("orderId");
        expect(parsed).toHaveProperty("amount");
        expect(parsed).toHaveProperty("currency");
      });
    });

    it("should produce valid error JSON structure for Pino", () => {
      const requestContext = {
        requestId: "req-123",
        traceId: "trace-456",
      };

      const error = new Error("Test error");

      contextService.run(requestContext, () => {
        const errorContext = createErrorContext(
          contextService,
          "createOrder",
          error,
          { orderId: "order-xyz" },
        );

        // Verify structure is JSON-serializable
        const json = JSON.stringify(errorContext);
        const parsed = JSON.parse(json);

        expect(parsed).toHaveProperty("operation");
        expect(parsed).toHaveProperty("error");
        expect(parsed).toHaveProperty("errorType");
        expect(parsed).toHaveProperty("stack");
        expect(parsed).toHaveProperty("requestId");
        expect(parsed).toHaveProperty("traceId");
        expect(parsed).toHaveProperty("orderId");
      });
    });
  });
});

