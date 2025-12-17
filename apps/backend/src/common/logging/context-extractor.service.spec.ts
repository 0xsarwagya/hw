import { Test, TestingModule } from "@nestjs/testing";
import { ContextExtractorService } from "./context-extractor.service";
import { Request } from "express";

describe("ContextExtractorService", () => {
  let service: ContextExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextExtractorService],
    }).compile();

    service = module.get<ContextExtractorService>(ContextExtractorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("extractFromRequest", () => {
    it("should extract request ID from headers", () => {
      const req = {
        headers: { "x-request-id": "test-request-id" },
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.requestId).toBe("test-request-id");
    });

    it("should generate request ID if not in headers", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.requestId).toBeDefined();
      expect(typeof context.requestId).toBe("string");
    });

    it("should extract correlation ID from headers", () => {
      const req = {
        headers: { "x-correlation-id": "correlation-123" },
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.correlationId).toBe("correlation-123");
    });

    it("should extract IP address", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "192.168.1.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.ip).toBe("192.168.1.1");
    });

    it("should extract IP from X-Forwarded-For header", () => {
      const req = {
        headers: { "x-forwarded-for": "203.0.113.1, 192.168.1.1" },
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.ip).toBe("203.0.113.1");
    });

    it("should extract user info from req.user", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "customer",
        },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect((context as any).userId).toBe("user-123");
      expect((context as any).userEmail).toBe("test@example.com");
      expect((context as any).userRole).toBe("customer");
    });

    it("should extract cart ID from params", () => {
      const req = {
        headers: {},
        params: { cartId: "cart-123" },
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.cartId).toBe("cart-123");
    });

    it("should extract cart ID from query", () => {
      const req = {
        headers: {},
        params: {},
        query: { cartId: "cart-456" },
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.cartId).toBe("cart-456");
    });

    it("should extract cart ID from body", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: { cartId: "cart-789" },
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.cartId).toBe("cart-789");
    });

    it("should extract order ID from params", () => {
      const req = {
        headers: {},
        params: { orderId: "order-123" },
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.orderId).toBe("order-123");
    });

    it("should extract checkout ID from body", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: { checkoutSessionId: "checkout-123" },
        socket: { remoteAddress: "127.0.0.1" },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.checkoutId).toBe("checkout-123");
    });

    it("should extract customer ID from user if available", () => {
      const req = {
        headers: {},
        params: {},
        query: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
        user: {
          id: "user-123",
          customerId: "customer-456",
        },
      } as unknown as Request;

      const context = service.extractFromRequest(req);
      expect(context.customerId).toBe("customer-456");
    });
  });

  describe("extractRequestMetadata", () => {
    it("should extract request metadata", () => {
      const req = {
        method: "POST",
        url: "/api/orders",
        path: "/api/orders",
        headers: {
          "user-agent": "Mozilla/5.0",
          referer: "https://example.com",
          origin: "https://example.com",
          "content-type": "application/json",
          "content-length": "100",
        },
      } as unknown as Request;

      const metadata = service.extractRequestMetadata(req);
      expect(metadata.method).toBe("POST");
      expect(metadata.url).toBe("/api/orders");
      expect(metadata.userAgent).toBe("Mozilla/5.0");
      expect(metadata.referer).toBe("https://example.com");
    });
  });
});

