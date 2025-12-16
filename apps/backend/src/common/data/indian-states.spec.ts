import {
  getAllStates,
  getAllStatesAndUTs,
  getAllUnionTerritories,
  getStateByCode,
  getStateByGstCode,
  getStateByName,
  INDIAN_STATES,
} from "./indian-states";

describe("Indian States Data", () => {
  describe("INDIAN_STATES", () => {
    it("should have exactly 36 entries (28 states + 8 UTs)", () => {
      expect(INDIAN_STATES).toHaveLength(36);
    });

    it("should have 28 states", () => {
      const states = INDIAN_STATES.filter((s) => s.type === "state");
      expect(states).toHaveLength(28);
    });

    it("should have 8 union territories", () => {
      const uts = INDIAN_STATES.filter((s) => s.type === "union_territory");
      expect(uts).toHaveLength(8);
    });

    it("should have unique state codes", () => {
      const codes = INDIAN_STATES.map((s) => s.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(36);
    });

    it("should have unique GST state codes", () => {
      const gstCodes = INDIAN_STATES.map((s) => s.gstStateCode);
      const uniqueGstCodes = new Set(gstCodes);
      expect(uniqueGstCodes.size).toBe(36);
    });

    it("should have GST state codes in range 1-38", () => {
      INDIAN_STATES.forEach((state) => {
        expect(state.gstStateCode).toBeGreaterThanOrEqual(1);
        expect(state.gstStateCode).toBeLessThanOrEqual(38);
      });
    });
  });

  describe("getStateByName", () => {
    it("should find state by exact name", () => {
      const state = getStateByName("Maharashtra");
      expect(state).toBeDefined();
      expect(state?.name).toBe("Maharashtra");
      expect(state?.code).toBe("MH");
    });

    it("should find state by case-insensitive name", () => {
      const state = getStateByName("maharashTra");
      expect(state).toBeDefined();
      expect(state?.name).toBe("Maharashtra");
    });

    it("should return undefined for invalid state name", () => {
      const state = getStateByName("Invalid State");
      expect(state).toBeUndefined();
    });
  });

  describe("getStateByCode", () => {
    it("should find state by code", () => {
      const state = getStateByCode("MH");
      expect(state).toBeDefined();
      expect(state?.name).toBe("Maharashtra");
    });

    it("should find state by case-insensitive code", () => {
      const state = getStateByCode("mh");
      expect(state).toBeDefined();
      expect(state?.code).toBe("MH");
    });

    it("should return undefined for invalid code", () => {
      const state = getStateByCode("XX");
      expect(state).toBeUndefined();
    });
  });

  describe("getStateByGstCode", () => {
    it("should find state by GST code", () => {
      const state = getStateByGstCode(27);
      expect(state).toBeDefined();
      expect(state?.name).toBe("Maharashtra");
    });

    it("should return undefined for invalid GST code", () => {
      const state = getStateByGstCode(99);
      expect(state).toBeUndefined();
    });
  });

  describe("getAllStates", () => {
    it("should return only states", () => {
      const states = getAllStates();
      expect(states).toHaveLength(28);
      states.forEach((state) => {
        expect(state.type).toBe("state");
      });
    });
  });

  describe("getAllUnionTerritories", () => {
    it("should return only union territories", () => {
      const uts = getAllUnionTerritories();
      expect(uts).toHaveLength(8);
      uts.forEach((ut) => {
        expect(ut.type).toBe("union_territory");
      });
    });
  });

  describe("getAllStatesAndUTs", () => {
    it("should return all 36 entries", () => {
      const all = getAllStatesAndUTs();
      expect(all).toHaveLength(36);
    });
  });
});

