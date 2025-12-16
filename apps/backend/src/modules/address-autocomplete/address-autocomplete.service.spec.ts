import { Test, TestingModule } from "@nestjs/testing";
import { and, db, ilike, pincodes, sql } from "@vcecom/db";
import { AddressAutocompleteService } from "./address-autocomplete.service";
import {
  DistrictAutocompleteQueryDto,
  StateAutocompleteQueryDto,
} from "./dto/autocomplete-query.dto";

// Mock database module
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  ilike: jest.fn(),
  pincodes: {},
  sql: jest.fn((strings, ...values) => ({
    strings,
    values,
  })),
}));

describe("AddressAutocompleteService", () => {
  let service: AddressAutocompleteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressAutocompleteService],
    }).compile();

    service = module.get<AddressAutocompleteService>(
      AddressAutocompleteService,
    );

    jest.clearAllMocks();
  });

  describe("getStateSuggestions", () => {
    it("should return state suggestions matching query", async () => {
      const queryDto: StateAutocompleteQueryDto = {
        query: "Mah",
        limit: 10,
      };

      const mockStates = [
        {
          state: "Maharashtra",
          stateCode: "MH",
          districtCount: 36,
        },
      ];

      const mockTotal = { count: 1 };

      // Mock state query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockStates),
              }),
            }),
          }),
        }),
      });

      // Mock count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTotal]),
        }),
      });

      const result = await service.getStateSuggestions(queryDto);

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.states[0].name).toBe("Maharashtra");
      expect(result.states[0].code).toBe("MH");
      expect(result.total).toBe(1);
    });

    it("should respect limit parameter", async () => {
      const queryDto: StateAutocompleteQueryDto = {
        query: "Ma",
        limit: 5,
      };

      const mockStates = Array.from({ length: 5 }, (_, i) => ({
        state: `State${i}`,
        stateCode: `ST${i}`,
        districtCount: 10,
      }));

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockStates),
              }),
            }),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      const result = await service.getStateSuggestions(queryDto);

      expect(result.states).toHaveLength(5);
    });

    it("should return empty array when no states match", async () => {
      const queryDto: StateAutocompleteQueryDto = {
        query: "XYZ",
        limit: 10,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const result = await service.getStateSuggestions(queryDto);

      expect(result.states).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getDistrictSuggestions", () => {
    it("should return district suggestions matching query", async () => {
      const queryDto: DistrictAutocompleteQueryDto = {
        query: "Mum",
        limit: 10,
      };

      const mockDistricts = [
        {
          district: "Mumbai",
          state: "Maharashtra",
          stateCode: "MH",
          pincodeCount: 150,
        },
      ];

      const mockTotal = { count: 1 };

      // Mock district query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockDistricts),
              }),
            }),
          }),
        }),
      });

      // Mock count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTotal]),
        }),
      });

      const result = await service.getDistrictSuggestions(queryDto);

      expect(result).toBeDefined();
      expect(result.districts).toHaveLength(1);
      expect(result.districts[0].name).toBe("Mumbai");
      expect(result.districts[0].state).toBe("Maharashtra");
      expect(result.total).toBe(1);
    });

    it("should filter districts by state when provided", async () => {
      const queryDto: DistrictAutocompleteQueryDto = {
        query: "Mum",
        state: "Maharashtra",
        limit: 10,
      };

      const mockDistricts = [
        {
          district: "Mumbai",
          state: "Maharashtra",
          stateCode: "MH",
          pincodeCount: 150,
        },
      ];

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockDistricts),
              }),
            }),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const result = await service.getDistrictSuggestions(queryDto);

      expect(result.districts).toHaveLength(1);
      expect(result.districts[0].state).toBe("Maharashtra");
    });

    it("should respect limit parameter", async () => {
      const queryDto: DistrictAutocompleteQueryDto = {
        query: "Mu",
        limit: 3,
      };

      const mockDistricts = Array.from({ length: 3 }, (_, i) => ({
        district: `District${i}`,
        state: "Maharashtra",
        stateCode: "MH",
        pincodeCount: 50,
      }));

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockDistricts),
              }),
            }),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      const result = await service.getDistrictSuggestions(queryDto);

      expect(result.districts).toHaveLength(3);
    });
  });

  describe("getAllStates", () => {
    it("should return all states", async () => {
      const mockStates = [
        {
          state: "Maharashtra",
          stateCode: "MH",
          districtCount: 36,
        },
        {
          state: "Gujarat",
          stateCode: "GJ",
          districtCount: 33,
        },
      ];

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockStates),
          }),
        }),
      });

      const result = await service.getAllStates();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Maharashtra");
      expect(result[1].name).toBe("Gujarat");
    });

    it("should return empty array when no states exist", async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getAllStates();

      expect(result).toHaveLength(0);
    });
  });

  describe("getDistrictsByState", () => {
    it("should return districts for a specific state", async () => {
      const state = "Maharashtra";
      const mockDistricts = [
        {
          district: "Mumbai",
          state: "Maharashtra",
          stateCode: "MH",
          pincodeCount: 150,
        },
        {
          district: "Pune",
          state: "Maharashtra",
          stateCode: "MH",
          pincodeCount: 120,
        },
      ];

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockDistricts),
            }),
          }),
        }),
      });

      const result = await service.getDistrictsByState(state);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Mumbai");
      expect(result[1].name).toBe("Pune");
      expect(result.every((d) => d.state === "Maharashtra")).toBe(true);
    });

    it("should return empty array when no districts found for state", async () => {
      const state = "NonExistentState";

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getDistrictsByState(state);

      expect(result).toHaveLength(0);
    });
  });
});

