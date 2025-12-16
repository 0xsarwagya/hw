import { Test, TestingModule } from "@nestjs/testing";
import { DiscountsController, PublicDiscountsController } from "./discounts.controller";
import { DiscountsService } from "./discounts.service";
import { CreateDiscountDto, DiscountType, DiscountValueType } from "./dto/create-discount.dto";

// Mock database to avoid DATABASE_URL requirement
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  discounts: {},
  discountProducts: {},
  discountCategories: {},
  discountCollections: {},
  discountTags: {},
  discountGetProducts: {},
  discountGetCategories: {},
  discountGetCollections: {},
  discountGetTags: {},
  discountUsages: {},
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn(),
  desc: jest.fn(),
}));

describe("DiscountsController", () => {
  let controller: DiscountsController;
  let service: DiscountsService;

  const mockDiscountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateDiscount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountsController],
      providers: [
        {
          provide: DiscountsService,
          useValue: mockDiscountsService,
        },
      ],
    }).compile();

    controller = module.get<DiscountsController>(DiscountsController);
    service = module.get<DiscountsService>(DiscountsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a discount", async () => {
      const createDto: CreateDiscountDto = {
        code: "SAVE20",
        name: "20% Off",
        type: DiscountType.STANDARD,
        valueType: DiscountValueType.PERCENTAGE,
        value: 20,
      };

      const mockResponse = {
        id: "discount-1",
        ...createDto,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDiscountsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResponse);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findAll", () => {
    it("should return paginated discounts", async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockDiscountsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it("should use default page and limit", async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockDiscountsService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("findOne", () => {
    it("should return a discount by id", async () => {
      const mockDiscount = {
        id: "discount-1",
        code: "SAVE20",
        name: "20% Off",
      };

      mockDiscountsService.findOne.mockResolvedValue(mockDiscount);

      const result = await controller.findOne("discount-1");

      expect(result).toEqual(mockDiscount);
      expect(service.findOne).toHaveBeenCalledWith("discount-1");
    });
  });

  describe("update", () => {
    it("should update a discount", async () => {
      const updateDto = { name: "Updated" };
      const mockResponse = {
        id: "discount-1",
        code: "SAVE20",
        name: "Updated",
      };

      mockDiscountsService.update.mockResolvedValue(mockResponse);

      const result = await controller.update("discount-1", updateDto);

      expect(result).toEqual(mockResponse);
      expect(service.update).toHaveBeenCalledWith("discount-1", updateDto);
    });
  });

  describe("remove", () => {
    it("should delete a discount", async () => {
      const mockResponse = { message: "Discount deleted successfully" };

      mockDiscountsService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove("discount-1");

      expect(result).toEqual(mockResponse);
      expect(service.remove).toHaveBeenCalledWith("discount-1");
    });
  });
});

describe("PublicDiscountsController", () => {
  let controller: PublicDiscountsController;
  let service: DiscountsService;

  const mockDiscountsService = {
    validateDiscount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicDiscountsController],
      providers: [
        {
          provide: DiscountsService,
          useValue: mockDiscountsService,
        },
      ],
    }).compile();

    controller = module.get<PublicDiscountsController>(PublicDiscountsController);
    service = module.get<DiscountsService>(DiscountsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("validateDiscount", () => {
    it("should validate a discount code", async () => {
      const req = { user: { id: "user-1" } };
      const validateDto = { code: "SAVE20", orderAmount: 1000 };
      const mockResponse = {
        isValid: true,
        discount: { code: "SAVE20" },
      };

      mockDiscountsService.validateDiscount.mockResolvedValue(mockResponse);

      const result = await controller.validateDiscount(req, validateDto);

      expect(result).toEqual(mockResponse);
      expect(service.validateDiscount).toHaveBeenCalledWith(
        "SAVE20",
        "user-1",
        1000,
      );
    });

    it("should validate discount without user", async () => {
      const req = {};
      const validateDto = { code: "SAVE20", orderAmount: 1000 };
      const mockResponse = {
        isValid: true,
        discount: { code: "SAVE20" },
      };

      mockDiscountsService.validateDiscount.mockResolvedValue(mockResponse);

      const result = await controller.validateDiscount(req, validateDto);

      expect(result).toEqual(mockResponse);
      expect(service.validateDiscount).toHaveBeenCalledWith(
        "SAVE20",
        undefined,
        1000,
      );
    });
  });
});

