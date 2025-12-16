import { Test, TestingModule } from "@nestjs/testing";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";
import { ApplyDiscountDto } from "./dto/apply-discount.dto";

// Mock database to avoid DATABASE_URL requirement
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  carts: {},
  cartItems: {},
  products: {},
  productVariants: {},
  customers: {},
  addresses: {},
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn(),
}));

describe("CartsController", () => {
  let controller: CartsController;
  let service: CartsService;

  const mockCartsService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    applyDiscount: jest.fn(),
    removeDiscount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    service = module.get<CartsService>(CartsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("applyDiscount", () => {
    it("should apply discount code to cart", async () => {
      const req = { user: { id: "user-1" } };
      const applyDto: ApplyDiscountDto = { code: "SAVE20" };
      const mockCart = {
        id: "cart-1",
        discountCode: "SAVE20",
        discountAmount: 200,
        subtotal: 1000,
        total: 800,
      };

      mockCartsService.applyDiscount.mockResolvedValue(mockCart);

      const result = await controller.applyDiscount(req, applyDto, undefined);

      expect(result).toEqual(mockCart);
      expect(service.applyDiscount).toHaveBeenCalledWith(
        "user-1",
        null,
        "SAVE20",
      );
    });

    it("should apply discount with session ID", async () => {
      const req = {};
      const applyDto: ApplyDiscountDto = { code: "SAVE20" };
      const mockCart = {
        id: "cart-1",
        discountCode: "SAVE20",
        discountAmount: 200,
      };

      mockCartsService.applyDiscount.mockResolvedValue(mockCart);

      const result = await controller.applyDiscount(req, applyDto, "session-1");

      expect(result).toEqual(mockCart);
      expect(service.applyDiscount).toHaveBeenCalledWith(
        null,
        "session-1",
        "SAVE20",
      );
    });
  });

  describe("removeDiscount", () => {
    it("should remove discount from cart", async () => {
      const req = { user: { id: "user-1" } };
      const mockCart = {
        id: "cart-1",
        discountCode: null,
        discountAmount: 0,
        subtotal: 1000,
        total: 1000,
      };

      mockCartsService.removeDiscount.mockResolvedValue(mockCart);

      const result = await controller.removeDiscount(req, undefined);

      expect(result).toEqual(mockCart);
      expect(service.removeDiscount).toHaveBeenCalledWith("user-1", null);
    });

    it("should remove discount with session ID", async () => {
      const req = {};
      const mockCart = {
        id: "cart-1",
        discountCode: null,
        discountAmount: 0,
      };

      mockCartsService.removeDiscount.mockResolvedValue(mockCart);

      const result = await controller.removeDiscount(req, "session-1");

      expect(result).toEqual(mockCart);
      expect(service.removeDiscount).toHaveBeenCalledWith(null, "session-1");
    });
  });
});

