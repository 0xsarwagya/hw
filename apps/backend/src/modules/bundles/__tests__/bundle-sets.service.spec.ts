import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { and, bundleSets, bundles, db, eq } from "@vcecom/db";
import { BundleDefinitionService } from "../services/bundle-definition.service";
import { BundleSetsService } from "../services/bundle-sets.service";
import { CreateBundleSetDto } from "../dto/create-bundle-set.dto";

jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  bundles: {},
  bundleSets: {},
}));

describe("BundleSetsService", () => {
  let service: BundleSetsService;
  let bundleDefinitionService: jest.Mocked<BundleDefinitionService>;

  const mockBundleDefinitionService = {
    validateBundleSetCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleSetsService,
        {
          provide: BundleDefinitionService,
          useValue: mockBundleDefinitionService,
        },
      ],
    }).compile();

    service = module.get<BundleSetsService>(BundleSetsService);
    bundleDefinitionService = module.get(BundleDefinitionService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a bundle set successfully", async () => {
      const createDto: CreateBundleSetDto = {
        title: "Choose T-shirt",
        minQuantity: 1,
        maxQuantity: 1,
      };

      const mockBundle = { id: "bundle-1" };
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBundle]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      mockBundleDefinitionService.validateBundleSetCount.mockResolvedValue(
        undefined,
      );

      const existingSets = [{ sortOrder: 0 }];
      const mockSelectSets = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(existingSets),
        }),
      });
      (db.select as jest.Mock).mockReturnValueOnce(mockSelect()).mockReturnValueOnce(mockSelectSets());

      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          { id: "set-1", ...createDto, sortOrder: 1 },
        ]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      const result = await service.create("bundle-1", createDto);

      expect(result.id).toBeDefined();
      expect(result.message).toBe("Bundle set created successfully");
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
        service.create("invalid-id", {
          title: "Test",
          minQuantity: 1,
          maxQuantity: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if max sets exceeded", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBundle]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      mockBundleDefinitionService.validateBundleSetCount.mockRejectedValue(
        new BadRequestException("Max sets exceeded"),
      );

      await expect(
        service.create("bundle-1", {
          title: "Test",
          minQuantity: 1,
          maxQuantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if minQuantity > maxQuantity", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBundle]),
          }),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      mockBundleDefinitionService.validateBundleSetCount.mockResolvedValue(
        undefined,
      );

      await expect(
        service.create("bundle-1", {
          title: "Test",
          minQuantity: 5,
          maxQuantity: 3,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update a bundle set successfully", async () => {
      const updateDto = { title: "Updated Set" };
      const mockBundle = { id: "bundle-1" };
      const mockSet = {
        id: "set-1",
        bundleId: "bundle-1",
        title: "Original",
        minQuantity: 1,
        maxQuantity: 1,
      };

      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockBundle]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockSet]),
            }),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const result = await service.update("bundle-1", "set-1", updateDto);

      expect(result.message).toBe("Bundle set updated successfully");
    });

    it("should throw NotFoundException if set not found", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockBundle]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.update("bundle-1", "invalid-set", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a bundle set successfully", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSet = { id: "set-1", bundleId: "bundle-1" };

      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockBundle]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockSet]),
            }),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db.delete as jest.Mock).mockReturnValue(mockDelete());

      const result = await service.remove("bundle-1", "set-1");

      expect(result.message).toBe("Bundle set deleted successfully");
    });
  });

  describe("validateSetHasItems", () => {
    it("should throw BadRequestException if set has no items", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.validateSetHasItems("set-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

