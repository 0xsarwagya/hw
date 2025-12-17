import { Test, TestingModule } from "@nestjs/testing";
import { ContextService, RequestContext } from "./context.service";

describe("ContextService", () => {
  let service: ContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextService],
    }).compile();

    service = module.get<ContextService>(ContextService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("run", () => {
    it("should run function within context", () => {
      const context: RequestContext = {
        requestId: "test-request-id",
        correlationId: "test-correlation-id",
      };

      const result = service.run(context, () => {
        return service.get();
      });

      expect(result).toEqual(context);
    });

    it("should isolate contexts between runs", () => {
      const context1: RequestContext = { requestId: "id1" };
      const context2: RequestContext = { requestId: "id2" };

      const result1 = service.run(context1, () => service.get()?.requestId);
      const result2 = service.run(context2, () => service.get()?.requestId);

      expect(result1).toBe("id1");
      expect(result2).toBe("id2");
    });
  });

  describe("get", () => {
    it("should return undefined when no context", () => {
      expect(service.get()).toBeUndefined();
    });

    it("should return current context", () => {
      const context: RequestContext = { requestId: "test-id" };
      service.run(context, () => {
        expect(service.get()).toEqual(context);
      });
    });
  });

  describe("getValue", () => {
    it("should return undefined when no context", () => {
      expect(service.getValue("requestId")).toBeUndefined();
    });

    it("should return value from context", () => {
      const context: RequestContext = {
        requestId: "test-id",
        customerId: "customer-123",
      };
      service.run(context, () => {
        expect(service.getValue("requestId")).toBe("test-id");
        expect(service.getValue("customerId")).toBe("customer-123");
      });
    });
  });

  describe("setValue", () => {
    it("should set value in existing context", () => {
      const context: RequestContext = { requestId: "test-id" };
      service.run(context, () => {
        service.setValue("customerId", "customer-123");
        expect(service.getValue("customerId")).toBe("customer-123");
      });
    });

    it("should not create context if none exists", () => {
      service.setValue("requestId", "test-id");
      expect(service.get()).toBeUndefined();
    });
  });

  describe("getRequestId", () => {
    it("should return requestId from context", () => {
      const context: RequestContext = { requestId: "test-id" };
      service.run(context, () => {
        expect(service.getRequestId()).toBe("test-id");
      });
    });
  });

  describe("getTraceId", () => {
    it("should return traceId from context", () => {
      const context: RequestContext = { traceId: "trace-123" };
      service.run(context, () => {
        expect(service.getTraceId()).toBe("trace-123");
      });
    });
  });

  describe("getSpanId", () => {
    it("should return spanId from context", () => {
      const context: RequestContext = { spanId: "span-123" };
      service.run(context, () => {
        expect(service.getSpanId()).toBe("span-123");
      });
    });
  });
});

