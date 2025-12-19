import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  and,
  asc,
  bundleSetItems,
  bundleSets,
  bundles,
  db,
  desc,
  eq,
} from "@vcecom/db";
import { BundleCacheStore } from "../../redis-store/stores/bundle-cache-store";
import { BundleDefinitionService } from "../services/bundle-definition.service";
import { CreateBundleDto } from "../dto/create-bundle.dto";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  asc: jest.fn(),
  desc: jest.fn(),
  sql: jest.fn((strings, ...values) => {
    // Return a mock SQL template tag function
    const template = Object.assign(
      (strings: TemplateStringsArray, ...values: any[]) => strings[0],
      { raw: strings }
    );
    return template;
  }),
  bundles: {},
  bundleSets: {},
  bundleSetItems: {},
}));

describe("BundleDefinitionService", () => {
  let service: BundleDefinitionService;
  let bundleCacheStore: jest.Mocked<BundleCacheStore>;

  beforeEach(async () => {
    const mockBundleCacheStore = {
      storeBundleDefinition: jest.fn().mockResolvedValue(undefined),
      getBundleDefinition: jest.fn().mockResolvedValue(null),
      invalidateBundle: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleDefinitionService,
        {
          provide: BundleCacheStore,
          useValue: mockBundleCacheStore,
        },
      ],
    }).compile();

    service = module.get<BundleDefinitionService>(BundleDefinitionService);
    bundleCacheStore = module.get(BundleCacheStore);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a bundle successfully", async () => {
      const createDto: CreateBundleDto = {
        title: "Summer Bundle",
        description: "A great summer bundle",
        isActive: true,
        allowMixAndMatch: false,
      };

      const mockBundle = {
        id: "bundle-1",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockBundle]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      const mockHydrate = jest
        .spyOn(service as any, "hydrateBundle")
        .mockResolvedValue({
          ...mockBundle,
          sets: [],
        });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe("bundle-1");
      expect(mockHydrate).toHaveBeenCalledWith("bundle-1");
    });

    it("should create bundle with default values", async () => {
      const createDto: CreateBundleDto = {
        title: "Test Bundle",
      };

      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        description: null,
        isActive: true,
        allowMixAndMatch: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockBundle]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      jest.spyOn(service as any, "hydrateBundle").mockResolvedValue({
        ...mockBundle,
        sets: [],
      });

      const result = await service.create(createDto);

      expect(result.isActive).toBe(true);
      expect(result.allowMixAndMatch).toBe(false);
    });
  });

  describe("findAll", () => {
    it("should return paginated bundles", async () => {
      const mockBundles = [
        {
          id: "bundle-1",
          title: "Bundle 1",
          createdAt: new Date(),
        },
        {
          id: "bundle-2",
          title: "Bundle 2",
          createdAt: new Date(),
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue(mockBundles),
            }),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      jest
        .spyOn(service as any, "hydrateBundle")
        .mockResolvedValue({ id: "bundle-1", sets: [] });

      const result = await service.findAll(1, 10);

      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should enforce max limit of 100", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      jest
        .spyOn(service as any, "hydrateBundle")
        .mockResolvedValue({ id: "bundle-1", sets: [] });

      await service.findAll(1, 200);

      // Should use max limit of 100
      expect(mockSelect().from().orderBy().limit).toHaveBeenCalledWith(100);
    });
  });

  describe("findOne", () => {
    it("should return a bundle by id", async () => {
      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        sets: [],
      };

      jest
        .spyOn(service as any, "hydrateBundle")
        .mockResolvedValue(mockBundle);

      const result = await service.findOne("bundle-1");

      expect(result).toEqual(mockBundle);
    });

    it("should throw NotFoundException if bundle not found", async () => {
      jest
        .spyOn(service as any, "hydrateBundle")
        .mockRejectedValue(new NotFoundException("Bundle not found"));

      await expect(service.findOne("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update a bundle successfully", async () => {
      const updateDto = { title: "Updated Bundle" };
      const mockBundle = {
        id: "bundle-1",
        title: "Original",
        description: null,
        isActive: true,
        allowMixAndMatch: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBundle]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { ...mockBundle, title: "Updated Bundle" },
            ]),
          }),
        }),
      });
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      jest
        .spyOn(service as any, "hydrateBundle")
        .mockResolvedValue({ ...mockBundle, title: "Updated Bundle", sets: [] });

      const result = await service.update("bundle-1", updateDto);

      expect(result.title).toBe("Updated Bundle");
    });

    it("should throw NotFoundException if bundle not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.update("invalid-id", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a bundle successfully", async () => {
      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBundle]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db.delete as jest.Mock).mockReturnValue(mockDelete());

      const result = await service.remove("bundle-1");

      expect(result.message).toBe("Bundle deleted successfully");
    });

    it("should throw NotFoundException if bundle not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(service.remove("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("validateBundleHasSets", () => {
    it("should throw BadRequestException if bundle has no sets", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.validateBundleHasSets("bundle-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should not throw if bundle has sets", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: "set-1" }]),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.validateBundleHasSets("bundle-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("validateBundleSetCount", () => {
    it("should throw BadRequestException if bundle has 15 or more sets", async () => {
      const mockSets = Array.from({ length: 15 }, (_, i) => ({ id: `set-${i}` }));
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSets),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.validateBundleSetCount("bundle-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should not throw if bundle has less than 15 sets", async () => {
      const mockSets = [{ id: "set-1" }];
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSets),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.validateBundleSetCount("bundle-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("getSetCount", () => {
    it("should return correct set count", async () => {
      const mockSets = [{ id: "set-1" }, { id: "set-2" }];
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSets),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const count = await service.getSetCount("bundle-1");

      expect(count).toBe(2);
    });
  });
});

