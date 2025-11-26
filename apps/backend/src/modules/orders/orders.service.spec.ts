import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  addresses,
  cartItems,
  carts,
  customers,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  productVariants,
  products,
  users,
} from "@vcecom/db";
import { CartsService } from "../carts/carts.service";
import { OrdersService } from "./orders.service";

// Mock dependencies
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn(),
  inArray: jest.fn(),
  sql: jest.fn(),
  addresses: {},
  cartItems: {},
  carts: {},
  customers: {},
  orderItems: {},
  orders: {},
  productVariants: {},
  products: {},
  users: {},
}));

describe("OrdersService", () => {
  let service: OrdersService;
  let cartsService: CartsService;

  const mockUserId = "user-123";
  const mockCustomerId = "customer-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";
  const mockCartId = "cart-123";
  const mockOrderId = "order-123";
  const mockProductId = "product-123";
  const mockVariantId = "variant-123";

  const mockCustomer = {
    id: mockCustomerId,
    userId: mockUserId,
    email: "test@example.com",
    phone: "1234567890",
    name: "Test Customer",
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

  const mockBillingAddress = {
    id: mockBillingAddressId,
    customerId: mockCustomerId,
    type: "billing" as const,
    street: "456 Billing St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: false,
  };

  const mockCart = {
    id: mockCartId,
    customerId: mockCustomerId,
    sessionId: null,
    subtotal: 1000,
    gstAmount: 180,
    total: 1180,
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "cart-item-123",
        cartId: mockCartId,
        productVariantId: mockVariantId,
        quantity: 2,
        price: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockProduct = {
    id: mockProductId,
    title: "Test Product",
    description: "Test Description",
    price: 500,
    gstRate: 18,
    hsnCode: "123456",
    status: "active" as const,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVariant = {
    id: mockVariantId,
    productId: mockProductId,
    sku: "SKU-001",
    price: 500,
    inventory: 10,
    size: null,
    color: null,
    weight: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: CartsService,
          useValue: {
            getCart: jest.fn(),
            clearCart: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    cartsService = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createOrderDto = {
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      shippingCost: 50,
    };

    it("should create order successfully from cart", async () => {
      // Mock getCustomerId
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      // Mock validateAddresses
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
      };

      // Mock getCart
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock cartItemsWithVariants query
      const mockCartItemsChain = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            variantInventory: 10,
            productGstRate: 18,
          },
        ]),
      };

      // Mock generateOrderNumber
      const mockOrdersChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: null,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock update inventory
      const mockUpdateInventoryChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain)
        .mockReturnValueOnce(mockOrdersChain);

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      (db.update as jest.Mock).mockReturnValue(mockUpdateInventoryChain);

      (cartsService.clearCart as jest.Mock).mockResolvedValue(mockCart);

      const result = await service.create(mockUserId, createOrderDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockOrderId);
      expect(result.orderNumber).toBe("ORD-2025-000001");
      expect(result.status).toBe("pending");
      expect(result.total).toBe(1230);
      expect(cartsService.clearCart).toHaveBeenCalledWith(mockUserId, null);
    });

    it("should throw NotFoundException if customer not found", async () => {
      const mockChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock).mockReturnValue(mockChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if shipping address not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if cart is empty", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      (cartsService.getCart as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [],
      });

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if insufficient inventory", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
      };

      const mockCartItemsChain = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 20, // More than available
            price: 500,
            variantInventory: 10, // Only 10 available
            productGstRate: 18,
          },
        ]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain);

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findOne", () => {
    it("should return order with items", async () => {
      const mockOrder = {
        id: mockOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending" as const,
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: null,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);

      const result = await service.findOne(mockUserId, mockOrderId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockOrderId);
      expect(result.items).toHaveLength(1);
    });

    it("should throw NotFoundException if order not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.findOne(mockUserId, mockOrderId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("generateOrderNumber", () => {
    it("should generate order number with sequence when orders exist", async () => {
      const mockOrdersChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { orderNumber: "ORD-2025-000005" },
        ]),
      };

      (db.select as jest.Mock).mockReturnValue(mockOrdersChain);

      // Access private method via reflection
      const generateOrderNumber = (service as any).generateOrderNumber.bind(
        service,
      );
      const result = await generateOrderNumber();

      expect(result).toBe("ORD-2025-000006");
    });

    it("should handle invalid order number format gracefully", async () => {
      const mockOrdersChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { orderNumber: "ORD-2025-INVALID" },
        ]),
      };

      (db.select as jest.Mock).mockReturnValue(mockOrdersChain);

      const generateOrderNumber = (service as any).generateOrderNumber.bind(
        service,
      );
      const result = await generateOrderNumber();

      expect(result).toMatch(/^ORD-\d{4}-000001$/);
    });
  });

  describe("validateAddresses", () => {
    it("should throw NotFoundException if billing address not found", async () => {
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      const validateAddresses = (service as any).validateAddresses.bind(
        service,
      );

      await expect(
        validateAddresses(
          mockCustomerId,
          mockShippingAddressId,
          mockBillingAddressId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    const createOrderDto = {
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      shippingCost: 50,
    };

    it("should throw BadRequestException if cart is null", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain) // getCustomerId
        .mockReturnValueOnce(mockShippingAddressChain) // validateAddresses - shipping
        .mockReturnValueOnce(mockBillingAddressChain); // validateAddresses - billing

      (cartsService.getCart as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if cart items is null", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      (cartsService.getCart as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: null,
      });

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return all orders for customer", async () => {
      const mockOrders = [
        {
          id: mockOrderId,
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000001",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockOrder = {
        id: mockOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending" as const,
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: null,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockOrderItemsChainForMap = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChainForMap);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
    });

    it("should return empty array when customer has no orders", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });

    it("should handle multiple orders with items", async () => {
      const mockOrders = [
        {
          id: mockOrderId,
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000001",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "order-456",
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000002",
          status: "confirmed" as const,
          subtotal: 2000,
          gstAmount: 360,
          shippingCost: 100,
          total: 2460,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems1 = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems2 = [
        {
          id: "order-item-456",
          orderId: "order-456",
          productVariantId: mockVariantId,
          quantity: 4,
          price: 500,
          gstRate: 18,
          gstAmount: 360,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomer]),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };

      const mockOrderItemsChain1 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems1),
        }),
      };

      const mockOrderItemsChain2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems2),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChain1)
        .mockReturnValueOnce(mockOrderItemsChain2);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].items).toHaveLength(1);
      expect(result[1].items).toHaveLength(1);
    });
  });
});
