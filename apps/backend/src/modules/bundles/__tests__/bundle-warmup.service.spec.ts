import { Test, TestingModule } from "@nestjs/testing";
import { BundleWarmupService } from "../services/bundle-warmup.service";
import { BundleDefinitionService } from "../services/bundle-definition.service";
import { BundleCacheStore } from "../../redis-store/stores/bundle-cache-store";

describe("BundleWarmupService", () => {
  let service: BundleWarmupService;
  let bundleDefinitionService: jest.Mocked<BundleDefinitionService>;
  let bundleCacheStore: jest.Mocked<BundleCacheStore>;

  beforeEach(async () => {
    const mockBundleDefinitionService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const mockBundleCacheStore = {
      storeBundleDefinition: jest.fn(),
      storeBundleSets: jest.fn(),
      storeBundleEligibility: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleWarmupService,
        {
          provide: BundleDefinitionService,
          useValue: mockBundleDefinitionService,
        },
        {
          provide: BundleCacheStore,
          useValue: mockBundleCacheStore,
        },
      ],
    }).compile();

    service = module.get<BundleWarmupService>(BundleWarmupService);
    bundleDefinitionService = module.get(BundleDefinitionService);
    bundleCacheStore = module.get(BundleCacheStore);
    jest.clearAllMocks();
  });

  describe("warmupBundle", () => {
    const mockBundle = {
      id: "bundle-1",
      title: "Test Bundle",
      isActive: true,
      sets: [
        {
          id: "set-1",
          title: "Set 1",
          items: [
            { variantId: "variant-1" },
            { variantId: "variant-2" },
          ],
        },
        {
          id: "set-2",
          title: "Set 2",
          items: [{ variantId: "variant-3" }],
        },
      ],
    };

    it("should warm up bundle cache successfully", async () => {
      bundleDefinitionService.findOne.mockResolvedValue(mockBundle as any);
      bundleCacheStore.storeBundleDefinition.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleSets.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleEligibility.mockResolvedValue(undefined);

      await service.warmupBundle("bundle-1");

      expect(bundleDefinitionService.findOne).toHaveBeenCalledWith("bundle-1");
      expect(bundleCacheStore.storeBundleDefinition).toHaveBeenCalledWith(
        "bundle-1",
        mockBundle,
      );
      expect(bundleCacheStore.storeBundleSets).toHaveBeenCalledWith(
        "bundle-1",
        mockBundle.sets,
      );
      expect(bundleCacheStore.storeBundleEligibility).toHaveBeenCalledTimes(2);
      expect(bundleCacheStore.storeBundleEligibility).toHaveBeenCalledWith(
        "bundle-1",
        "set-1",
        ["variant-1", "variant-2"],
      );
      expect(bundleCacheStore.storeBundleEligibility).toHaveBeenCalledWith(
        "bundle-1",
        "set-2",
        ["variant-3"],
      );
    });

    it("should throw error if bundle not found", async () => {
      bundleDefinitionService.findOne.mockRejectedValue(
        new Error("Bundle not found"),
      );

      await expect(service.warmupBundle("bundle-1")).rejects.toThrow();
    });
  });

  describe("warmupAllBundles", () => {
    it("should warm up all active bundles", async () => {
      const mockBundles = [
        {
          id: "bundle-1",
          title: "Bundle 1",
          isActive: true,
          sets: [],
        },
        {
          id: "bundle-2",
          title: "Bundle 2",
          isActive: true,
          sets: [],
        },
        {
          id: "bundle-3",
          title: "Bundle 3",
          isActive: false, // Inactive - should be skipped
          sets: [],
        },
      ];

      bundleDefinitionService.findAll.mockResolvedValue({ data: mockBundles } as any);
      bundleDefinitionService.findOne.mockResolvedValue({
        id: "bundle-1",
        sets: [],
      } as any);

      bundleCacheStore.storeBundleDefinition.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleSets.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleEligibility.mockResolvedValue(undefined);

      await service.warmupAllBundles();

      expect(bundleDefinitionService.findAll).toHaveBeenCalled();
      // Should warm up only active bundles (bundle-1 and bundle-2)
      expect(bundleDefinitionService.findOne).toHaveBeenCalledTimes(2);
    });

    it("should continue warming up other bundles if one fails", async () => {
      const mockBundles = [
        {
          id: "bundle-1",
          title: "Bundle 1",
          isActive: true,
          sets: [],
        },
        {
          id: "bundle-2",
          title: "Bundle 2",
          isActive: true,
          sets: [],
        },
      ];

      bundleDefinitionService.findAll.mockResolvedValue({ data: mockBundles } as any);
      bundleDefinitionService.findOne
        .mockRejectedValueOnce(new Error("Failed to load bundle-1"))
        .mockResolvedValueOnce({ id: "bundle-2", sets: [] } as any);

      bundleCacheStore.storeBundleDefinition.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleSets.mockResolvedValue(undefined);
      bundleCacheStore.storeBundleEligibility.mockResolvedValue(undefined);

      // Should not throw - should continue with other bundles
      await expect(service.warmupAllBundles()).resolves.not.toThrow();

      // Should still try to warm up bundle-2
      expect(bundleDefinitionService.findOne).toHaveBeenCalledTimes(2);
    });
  });
});

