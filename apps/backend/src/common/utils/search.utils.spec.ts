import {
  buildSearchPattern,
  buildSearchPatterns,
  calculateRelevanceScore,
  isLikelySku,
  parseSearchQuery,
} from "./search.utils";

describe("Search Utils", () => {
  describe("parseSearchQuery", () => {
    it("should parse simple query into keywords", () => {
      const result = parseSearchQuery("wireless headphones");
      expect(result.keywords).toEqual(["wireless", "headphones"]);
      expect(result.phrases).toEqual([]);
      expect(result.rawQuery).toBe("wireless headphones");
    });

    it("should extract quoted phrases", () => {
      const result = parseSearchQuery('wireless "noise cancelling" headphones');
      expect(result.keywords).toEqual(["wireless", "headphones"]);
      expect(result.phrases).toEqual(["noise cancelling"]);
    });

    it("should handle multiple quoted phrases", () => {
      const result = parseSearchQuery(
        '"wireless headphones" "bluetooth 5.0"',
      );
      expect(result.keywords).toEqual([]);
      expect(result.phrases).toEqual(["wireless headphones", "bluetooth 5.0"]);
    });

    it("should handle empty query", () => {
      const result = parseSearchQuery("");
      expect(result.keywords).toEqual([]);
      expect(result.phrases).toEqual([]);
      expect(result.rawQuery).toBe("");
    });

    it("should trim whitespace", () => {
      const result = parseSearchQuery("  wireless headphones  ");
      expect(result.keywords).toEqual(["wireless", "headphones"]);
      expect(result.rawQuery).toBe("wireless headphones");
    });
  });

  describe("buildSearchPattern", () => {
    it("should build pattern from first keyword", () => {
      const parsed = parseSearchQuery("wireless headphones");
      const pattern = buildSearchPattern(parsed);
      expect(pattern).toBe("wireless");
    });

    it("should prefer phrases over keywords", () => {
      const parsed = parseSearchQuery('wireless "noise cancelling"');
      const pattern = buildSearchPattern(parsed);
      expect(pattern).toBe("wireless");
    });

    it("should return empty string for empty query", () => {
      const parsed = parseSearchQuery("");
      const pattern = buildSearchPattern(parsed);
      expect(pattern).toBe("");
    });
  });

  describe("buildSearchPatterns", () => {
    it("should build patterns for all keywords and phrases", () => {
      const parsed = parseSearchQuery('wireless "noise cancelling" headphones');
      const patterns = buildSearchPatterns(parsed);
      expect(patterns).toContain("%wireless%");
      expect(patterns).toContain("%headphones%");
      expect(patterns).toContain("%noise cancelling%");
    });
  });

  describe("isLikelySku", () => {
    it("should identify SKU-like strings", () => {
      expect(isLikelySku("WH-001-BLK")).toBe(true);
      expect(isLikelySku("PROD123")).toBe(true);
      expect(isLikelySku("SKU_ABC_123")).toBe(true);
    });

    it("should reject non-SKU strings", () => {
      expect(isLikelySku("wireless headphones")).toBe(false);
      expect(isLikelySku("product name")).toBe(false);
      expect(isLikelySku("AB")).toBe(false); // Too short
      expect(isLikelySku("A".repeat(51))).toBe(false); // Too long
    });

    it("should handle edge cases", () => {
      expect(isLikelySku("")).toBe(false);
      expect(isLikelySku(null as unknown as string)).toBe(false);
    });
  });

  describe("calculateRelevanceScore", () => {
    it("should give highest score for exact title match", () => {
      const product = {
        title: "Wireless Headphones",
        description: "Some description",
      };
      const score = calculateRelevanceScore(
        product,
        "Wireless Headphones",
        parseSearchQuery("Wireless Headphones"),
      );
      expect(score).toBeGreaterThan(0.9);
    });

    it("should give high score for title containing query", () => {
      const product = {
        title: "Wireless Bluetooth Headphones",
        description: "Some description",
      };
      const score = calculateRelevanceScore(
        product,
        "wireless",
        parseSearchQuery("wireless"),
      );
      expect(score).toBeGreaterThan(0.5);
    });

    it("should give lower score for description match", () => {
      const product = {
        title: "Product",
        description: "Wireless headphones with noise cancellation",
      };
      const score = calculateRelevanceScore(
        product,
        "wireless",
        parseSearchQuery("wireless"),
      );
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(0.5);
    });

    it("should give high score for SKU match", () => {
      const product = {
        title: "Product",
        description: "Some description",
      };
      const score = calculateRelevanceScore(
        product,
        "WH-001",
        parseSearchQuery("WH-001"),
        "WH-001-BLK",
      );
      expect(score).toBeGreaterThan(0.8);
    });

    it("should combine multiple factors", () => {
      const product = {
        title: "Wireless Headphones",
        description: "Wireless bluetooth headphones",
      };
      const score = calculateRelevanceScore(
        product,
        "wireless",
        parseSearchQuery("wireless"),
      );
      expect(score).toBeGreaterThan(0.5);
    });
  });
});

