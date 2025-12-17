import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { BundleDefinitionService } from "../services/bundle-definition.service";
import { BundleEligibilityService } from "../services/bundle-eligibility.service";
import { UserBundleSelection } from "../services/bundle-eligibility.service";

jest.mock("../services/bundle-definition.service");

describe("BundleEligibilityService", () => {
  let service: BundleEligibilityService;
  let bundleDefinitionService: jest.Mocked<BundleDefinitionService>;

  const mockBundleDefinitionService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleEligibilityService,
        {
          provide: BundleDefinitionService,
          useValue: mockBundleDefinitionService,
        },
      ],
    }).compile();

    service = module.get<BundleEligibilityService>(BundleEligibilityService);
    bundleDefinitionService = module.get(BundleDefinitionService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getBundle", () => {
    it("should return bundle from definition service", async () => {
      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        sets: [],
      };

      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const result = await service.getBundle("bundle-1");

      expect(result).toEqual(mockBundle);
      expect(bundleDefinitionService.findOne).toHaveBeenCalledWith("bundle-1");
    });
  });

  describe("validateUserSelection", () => {
    const mockBundle = {
      id: "bundle-1",
      title: "Test Bundle",
      allowMixAndMatch: false,
      sets: [
        {
          id: "set-1",
          title: "Choose T-shirt",
          minQuantity: 1,
          maxQuantity: 1,
          items: [{ variantId: "variant-1" }, { variantId: "variant-2" }],
        },
        {
          id: "set-2",
          title: "Choose Pants",
          minQuantity: 1,
          maxQuantity: 2,
          items: [{ variantId: "variant-3" }],
        },
      ],
    };

    it("should validate valid selection", async () => {
      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const selection: UserBundleSelection = {
        "set-1": ["variant-1"],
        "set-2": ["variant-3"],
      };

      const result = await service.validateUserSelection(
        "bundle-1",
        selection,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject selection with missing sets", async () => {
      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const selection: UserBundleSelection = {
        "set-1": ["variant-1"],
      };

      const result = await service.validateUserSelection(
        "bundle-1",
        selection,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject selection with invalid variant", async () => {
      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const selection: UserBundleSelection = {
        "set-1": ["invalid-variant"],
        "set-2": ["variant-3"],
      };

      const result = await service.validateUserSelection(
        "bundle-1",
        selection,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("not allowed"))).toBe(true);
    });

    it("should reject selection with quantity violation", async () => {
      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const selection: UserBundleSelection = {
        "set-1": ["variant-1", "variant-2"], // Exceeds maxQuantity of 1
        "set-2": ["variant-3"],
      };

      const result = await service.validateUserSelection(
        "bundle-1",
        selection,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("allows at most"))).toBe(
        true,
      );
    });

    it("should reject selection with duplicates in same set", async () => {
      mockBundleDefinitionService.findOne.mockResolvedValue(mockBundle);

      const selection: UserBundleSelection = {
        "set-1": ["variant-1", "variant-1"],
        "set-2": ["variant-3"],
      };

      const result = await service.validateUserSelection(
        "bundle-1",
        selection,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("duplicate"))).toBe(true);
    });

    it("should return errors if bundle not found", async () => {
      mockBundleDefinitionService.findOne.mockRejectedValue(
        new NotFoundException("Bundle not found"),
      );

      const result = await service.validateUserSelection("invalid-id", {});

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

