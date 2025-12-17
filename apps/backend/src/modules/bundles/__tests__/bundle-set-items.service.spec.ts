import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  and,
  bundleSetItems,
  bundleSets,
  bundles,
  db,
  eq,
  productVariants,
} from "@vcecom/db";
import { BundleSetItemsService } from "../services/bundle-set-items.service";
import { AddBundleSetItemDto } from "../dto/add-bundle-set-item.dto";

jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  bundles: {},
  bundleSets: {},
  bundleSetItems: {},
  productVariants: {},
}));

describe("BundleSetItemsService", () => {
  let service: BundleSetItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BundleSetItemsService],
    }).compile();

    service = module.get<BundleSetItemsService>(BundleSetItemsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addItem", () => {
    it("should add an item successfully", async () => {
      const addDto: AddBundleSetItemDto = { variantId: "variant-1" };
      const mockBundle = { id: "bundle-1" };
      const mockSet = { id: "set-1", bundleId: "bundle-1" };
      const mockVariant = { id: "variant-1" };

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
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockVariant]),
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

      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          { id: "item-1", setId: "set-1", variantId: "variant-1" },
        ]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      const result = await service.addItem("bundle-1", "set-1", addDto);

      expect(result.id).toBe("item-1");
      expect(result.message).toBe("Item added to bundle set successfully");
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
        service.addItem("invalid-bundle", "set-1", { variantId: "variant-1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if variant not found", async () => {
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
        service.addItem("bundle-1", "set-1", { variantId: "invalid-variant" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if variant already in set", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSet = { id: "set-1", bundleId: "bundle-1" };
      const mockVariant = { id: "variant-1" };
      const mockExistingItem = { id: "item-1" };

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
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockVariant]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExistingItem]),
            }),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.addItem("bundle-1", "set-1", { variantId: "variant-1" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("removeItem", () => {
    it("should remove an item successfully", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSet = { id: "set-1", bundleId: "bundle-1" };
      const mockItem = { id: "item-1", setId: "set-1" };
      const mockRemainingItems = [{ id: "item-2" }];

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
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockRemainingItems),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db.delete as jest.Mock).mockReturnValue(mockDelete());

      const result = await service.removeItem("bundle-1", "set-1", "item-1");

      expect(result.message).toBe("Item removed from bundle set successfully");
    });

    it("should throw BadRequestException if removing last item", async () => {
      const mockBundle = { id: "bundle-1" };
      const mockSet = { id: "set-1", bundleId: "bundle-1" };
      const mockItem = { id: "item-1", setId: "set-1" };

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
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockItem]),
          }),
        });
      (db.select as jest.Mock).mockReturnValue(mockSelect());

      await expect(
        service.removeItem("bundle-1", "set-1", "item-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

