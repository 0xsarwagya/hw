import { Test, TestingModule } from "@nestjs/testing";
import { BundlesController } from "../bundles.controller";
import { BundleDefinitionService } from "../services/bundle-definition.service";
import { BundleSetItemsService } from "../services/bundle-set-items.service";
import { BundleSetsService } from "../services/bundle-sets.service";
import { CreateBundleDto } from "../dto/create-bundle.dto";
import { CreateBundleSetDto } from "../dto/create-bundle-set.dto";
import { AddBundleSetItemDto } from "../dto/add-bundle-set-item.dto";

jest.mock("@vcecom/db", () => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  bundles: {},
  bundleSets: {},
  bundleSetItems: {},
}));

describe("BundlesController", () => {
  let controller: BundlesController;
  let bundleDefinitionService: jest.Mocked<BundleDefinitionService>;
  let bundleSetsService: jest.Mocked<BundleSetsService>;
  let bundleSetItemsService: jest.Mocked<BundleSetItemsService>;

  const mockBundleDefinitionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBundleSetsService = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBundleSetItemsService = {
    addItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BundlesController],
      providers: [
        {
          provide: BundleDefinitionService,
          useValue: mockBundleDefinitionService,
        },
        {
          provide: BundleSetsService,
          useValue: mockBundleSetsService,
        },
        {
          provide: BundleSetItemsService,
          useValue: mockBundleSetItemsService,
        },
      ],
    }).compile();

    controller = module.get<BundlesController>(BundlesController);
    bundleDefinitionService = module.get(BundleDefinitionService);
    bundleSetsService = module.get(BundleSetsService);
    bundleSetItemsService = module.get(BundleSetItemsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a bundle", async () => {
      const createDto: CreateBundleDto = {
        title: "Summer Bundle",
        isActive: true,
      };

      const mockResponse = {
        id: "bundle-1",
        ...createDto,
        sets: [],
      };

      mockBundleDefinitionService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResponse);
      expect(bundleDefinitionService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findAll", () => {
    it("should return paginated bundles", async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockBundleDefinitionService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResponse);
      expect(bundleDefinitionService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it("should use default pagination", async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockBundleDefinitionService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll();

      expect(bundleDefinitionService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("findOne", () => {
    it("should return a bundle by id", async () => {
      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        sets: [],
      };

      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const result = await controller.findOne("bundle-1");

      expect(result).toEqual(mockBundle);
      expect(bundleDefinitionService.findOne).toHaveBeenCalledWith("bundle-1");
    });
  });

  describe("update", () => {
    it("should update a bundle", async () => {
      const updateDto = { title: "Updated Bundle" };
      const mockResponse = {
        id: "bundle-1",
        title: "Updated Bundle",
        sets: [],
      };

      mockBundleDefinitionService.update.mockResolvedValue(mockResponse);

      const result = await controller.update("bundle-1", updateDto);

      expect(result).toEqual(mockResponse);
      expect(bundleDefinitionService.update).toHaveBeenCalledWith(
        "bundle-1",
        updateDto,
      );
    });
  });

  describe("remove", () => {
    it("should delete a bundle", async () => {
      const mockResponse = { message: "Bundle deleted successfully" };

      mockBundleDefinitionService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove("bundle-1");

      expect(result).toEqual(mockResponse);
      expect(bundleDefinitionService.remove).toHaveBeenCalledWith("bundle-1");
    });
  });

  describe("createSet", () => {
    it("should create a bundle set", async () => {
      const createDto: CreateBundleSetDto = {
        title: "Choose T-shirt",
        minQuantity: 1,
        maxQuantity: 1,
      };

      const mockResponse = {
        id: "set-1",
        message: "Bundle set created successfully",
      };

      mockBundleSetsService.create.mockResolvedValue(mockResponse);

      const result = await controller.createSet("bundle-1", createDto);

      expect(result).toEqual(mockResponse);
      expect(bundleSetsService.create).toHaveBeenCalledWith(
        "bundle-1",
        createDto,
      );
    });
  });

  describe("addItem", () => {
    it("should add an item to a set", async () => {
      const addDto: AddBundleSetItemDto = { variantId: "variant-1" };
      const mockResponse = {
        id: "item-1",
        message: "Item added to bundle set successfully",
      };

      mockBundleSetItemsService.addItem.mockResolvedValue(mockResponse);

      const result = await controller.addItem("bundle-1", "set-1", addDto);

      expect(result).toEqual(mockResponse);
      expect(bundleSetItemsService.addItem).toHaveBeenCalledWith(
        "bundle-1",
        "set-1",
        addDto,
      );
    });
  });
});

