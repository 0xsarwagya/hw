import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import {
  addresses,
  customers,
  db,
  eq,
  invoices,
  orderItems,
  orders,
  products,
  productVariants,
  sql,
} from "@vcecom/db";
import { InvoicesService } from "./invoices.service";

// Mock dependencies
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  eq: jest.fn(),
  sql: jest.fn(),
  addresses: {},
  customers: {},
  invoices: {},
  orderItems: {},
  orders: {},
  products: {},
  productVariants: {},
}));

jest.mock("fs");
jest.mock("pdfkit");

describe("InvoicesService", () => {
  let service: InvoicesService;

  const mockOrderId = "order-123";
  const mockInvoiceId = "invoice-123";
  const mockCustomerId = "customer-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";

  const mockOrder = {
    id: mockOrderId,
    customerId: mockCustomerId,
    orderNumber: "ORD-2025-000001",
    status: "confirmed",
    subtotal: 1000,
    gstAmount: 180,
    shippingCost: 50,
    total: 1230,
    shippingAddressId: mockShippingAddressId,
    billingAddressId: mockBillingAddressId,
    createdAt: new Date("2025-11-28"),
    updatedAt: new Date("2025-11-28"),
  };

  const mockCustomer = {
    id: mockCustomerId,
    name: "Test Customer",
    email: "test@example.com",
    phone: "9876543210",
    gstin: "27ABCDE1234F1Z5",
  };

  const mockBillingAddress = {
    id: mockBillingAddressId,
    customerId: mockCustomerId,
    type: "billing" as const,
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: true,
  };

  const mockShippingAddress = {
    id: mockShippingAddressId,
    customerId: mockCustomerId,
    type: "shipping" as const,
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: true,
  };

  const mockOrderItems = [
    {
      id: "item-1",
      quantity: 2,
      price: 500,
      gstRate: 18,
      gstAmount: 180,
      productVariantId: "variant-1",
      productId: "product-1",
      productTitle: "Test Product",
      productHsnCode: "8518.12.00",
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicesService],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);

    // Mock environment variables
    process.env.SELLER_NAME = "Test Seller";
    process.env.SELLER_STATE = "Maharashtra";
    process.env.SELLER_GSTIN = "27TEST1234F1Z5";

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("generateInvoice", () => {
    it("should generate invoice for confirmed order", async () => {
      // Mock: Check if invoice exists
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock: Get order
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      // Mock: Get order items
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      });

      // Mock: Get customer
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      });

      // Mock: Get billing address
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      });

      // Mock: Get shipping address
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      });

      // Mock: Generate invoice number (no existing invoices)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock: File system operations
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.createWriteStream as jest.Mock).mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === "finish") {
            setTimeout(() => callback(), 0);
          }
          return {
            on: jest.fn(),
            pipe: jest.fn(),
          };
        }),
        pipe: jest.fn(),
      });

      // Mock PDF document
      const mockPDFDoc = {
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        addPage: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        pipe: jest.fn(),
      };
      (PDFDocument as unknown as jest.Mock).mockImplementation(() => mockPDFDoc);

      // Mock: Insert invoice
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: mockInvoiceId,
              invoiceNumber: "INV-2025-000001",
              orderId: mockOrderId,
              pdfPath: "/path/to/invoice.pdf",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });

      const result = await service.generateInvoice(mockOrderId);

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe("INV-2025-000001");
      expect(result.orderId).toBe(mockOrderId);
      expect(db.insert).toHaveBeenCalled();
    });

    it("should throw error if order not found", async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.generateInvoice(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error if order status is not confirmed", async () => {
      const pendingOrder = { ...mockOrder, status: "pending" };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([pendingOrder]),
          }),
        }),
      });

      await expect(service.generateInvoice(mockOrderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should return existing invoice if already generated", async () => {
      const existingInvoice = {
        id: mockInvoiceId,
        invoiceNumber: "INV-2025-000001",
        orderId: mockOrderId,
        pdfPath: "/path/to/invoice.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingInvoice]),
          }),
        }),
      });

      const result = await service.generateInvoice(mockOrderId);

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe("INV-2025-000001");
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return invoice by ID", async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        invoiceNumber: "INV-2025-000001",
        orderId: mockOrderId,
        pdfPath: "/path/to/invoice.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInvoice]),
          }),
        }),
      });

      const result = await service.findOne(mockInvoiceId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockInvoiceId);
      expect(result.downloadUrl).toBeDefined();
    });

    it("should throw error if invoice not found", async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.findOne(mockInvoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByOrderId", () => {
    it("should return invoice by order ID", async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        invoiceNumber: "INV-2025-000001",
        orderId: mockOrderId,
        pdfPath: "/path/to/invoice.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInvoice]),
          }),
        }),
      });

      const result = await service.findByOrderId(mockOrderId);

      expect(result).toBeDefined();
      expect(result?.orderId).toBe(mockOrderId);
    });

    it("should return null if invoice not found", async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.findByOrderId(mockOrderId);

      expect(result).toBeNull();
    });
  });

  describe("getInvoicePdfPath", () => {
    it("should return PDF path for invoice", async () => {
      const mockPdfPath = "/path/to/invoice.pdf";

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ pdfPath: mockPdfPath }]),
          }),
        }),
      });

      const result = await service.getInvoicePdfPath(mockInvoiceId);

      expect(result).toBe(mockPdfPath);
    });

    it("should throw error if invoice not found", async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getInvoicePdfPath(mockInvoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("generateInvoiceNumber", () => {
    it("should generate sequential invoice numbers", async () => {
      // First invoice - no existing invoices
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Access private method via type assertion
      const generateInvoiceNumber = (service as any).generateInvoiceNumber.bind(
        service,
      );
      const invoiceNumber1 = await generateInvoiceNumber();

      expect(invoiceNumber1).toMatch(/^INV-\d{4}-000001$/);

      // Second invoice - one existing invoice
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { invoiceNumber: "INV-2025-000001" },
              ]),
            }),
          }),
        }),
      });

      const invoiceNumber2 = await generateInvoiceNumber();

      expect(invoiceNumber2).toMatch(/^INV-\d{4}-000002$/);
    });
  });
});

