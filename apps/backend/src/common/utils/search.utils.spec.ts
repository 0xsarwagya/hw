import {
  buildSearchPattern,
  buildSearchPatterns,
  calculateRelevanceScore,
  isLikelySku,
  parseSearchQuery,
} from "./search.utils";

describe("Search Utils", () => {
  describe("parseSearchQuery", () => {
    it("should extract keywords from simple query", () => {
      // Arrange
      const query = "wireless headphones";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.keywords).toEqual(["wireless", "headphones"]);
    });

    it("should return empty phrases array for simple query without quotes", () => {
      // Arrange
      const query = "wireless headphones";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.phrases).toEqual([]);
    });

    it("should preserve raw query string", () => {
      // Arrange
      const query = "wireless headphones";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.rawQuery).toBe("wireless headphones");
    });

    it("should extract keywords excluding quoted phrases", () => {
      // Arrange
      const query = 'wireless "noise cancelling" headphones';

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.keywords).toEqual(["wireless", "headphones"]);
    });

    it("should extract quoted phrases from query", () => {
      // Arrange
      const query = 'wireless "noise cancelling" headphones';

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.phrases).toEqual(["noise cancelling"]);
    });

    it("should return empty keywords array when query contains only phrases", () => {
      // Arrange
      const query = '"wireless headphones" "bluetooth 5.0"';

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.keywords).toEqual([]);
    });

    it("should extract multiple quoted phrases", () => {
      // Arrange
      const query = '"wireless headphones" "bluetooth 5.0"';

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.phrases).toEqual(["wireless headphones", "bluetooth 5.0"]);
    });

    it("should return empty keywords array for empty query", () => {
      // Arrange
      const query = "";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.keywords).toEqual([]);
    });

    it("should return empty phrases array for empty query", () => {
      // Arrange
      const query = "";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.phrases).toEqual([]);
    });

    it("should return empty string as raw query for empty input", () => {
      // Arrange
      const query = "";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.rawQuery).toBe("");
    });

    it("should extract keywords from query with trimmed whitespace", () => {
      // Arrange
      const query = "  wireless headphones  ";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.keywords).toEqual(["wireless", "headphones"]);
    });

    it("should trim whitespace from raw query", () => {
      // Arrange
      const query = "  wireless headphones  ";

      // Act
      const result = parseSearchQuery(query);

      // Assert
      expect(result.rawQuery).toBe("wireless headphones");
    });
  });

  describe("buildSearchPattern", () => {
    it("should build pattern from first keyword", () => {
      // Arrange
      const parsed = parseSearchQuery("wireless headphones");

      // Act
      const pattern = buildSearchPattern(parsed);

      // Assert
      expect(pattern).toBe("wireless");
    });

    it("should prefer phrases over keywords", () => {
      // Arrange
      const parsed = parseSearchQuery('wireless "noise cancelling"');

      // Act
      const pattern = buildSearchPattern(parsed);

      // Assert
      expect(pattern).toBe("wireless");
    });

    it("should return empty string for empty query", () => {
      // Arrange
      const parsed = parseSearchQuery("");

      // Act
      const pattern = buildSearchPattern(parsed);

      // Assert
      expect(pattern).toBe("");
    });
  });

  describe("buildSearchPatterns", () => {
    it("should build pattern for first keyword", () => {
      // Arrange
      const parsed = parseSearchQuery('wireless "noise cancelling" headphones');

      // Act
      const patterns = buildSearchPatterns(parsed);

      // Assert
      expect(patterns).toContain("%wireless%");
    });

    it("should build pattern for second keyword", () => {
      // Arrange
      const parsed = parseSearchQuery('wireless "noise cancelling" headphones');

      // Act
      const patterns = buildSearchPatterns(parsed);

      // Assert
      expect(patterns).toContain("%headphones%");
    });

    it("should build pattern for quoted phrase", () => {
      // Arrange
      const parsed = parseSearchQuery('wireless "noise cancelling" headphones');

      // Act
      const patterns = buildSearchPatterns(parsed);

      // Assert
      expect(patterns).toContain("%noise cancelling%");
    });
  });

  describe("isLikelySku", () => {
    it("should return true for SKU with dashes", () => {
      // Arrange
      const sku = "WH-001-BLK";

      // Act
      const result = isLikelySku(sku);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for SKU with product prefix", () => {
      // Arrange
      const sku = "PROD123";

      // Act
      const result = isLikelySku(sku);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for SKU with underscores", () => {
      // Arrange
      const sku = "SKU_ABC_123";

      // Act
      const result = isLikelySku(sku);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for regular product name", () => {
      // Arrange
      const productName = "wireless headphones";

      // Act
      const result = isLikelySku(productName);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for plain text product name", () => {
      // Arrange
      const productName = "product name";

      // Act
      const result = isLikelySku(productName);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for string that is too short", () => {
      // Arrange
      const shortString = "AB";

      // Act
      const result = isLikelySku(shortString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for string that is too long", () => {
      // Arrange
      const longString = "A".repeat(51);

      // Act
      const result = isLikelySku(longString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      // Arrange
      const empty = "";

      // Act
      const result = isLikelySku(empty);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null value", () => {
      // Arrange
      const nullValue = null as unknown as string;

      // Act
      const result = isLikelySku(nullValue);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("calculateRelevanceScore", () => {
    it("should give highest score for exact title match", () => {
      // Arrange
      const product = {
        title: "Wireless Headphones",
        description: "Some description",
      };
      const query = "Wireless Headphones";
      const parsed = parseSearchQuery(query);

      // Act
      const score = calculateRelevanceScore(product, query, parsed);

      // Assert
      expect(score).toBeGreaterThan(0.9);
    });

    it("should give high score for title containing query", () => {
      // Arrange
      const product = {
        title: "Wireless Bluetooth Headphones",
        description: "Some description",
      };
      const query = "wireless";
      const parsed = parseSearchQuery(query);

      // Act
      const score = calculateRelevanceScore(product, query, parsed);

      // Assert
      expect(score).toBeGreaterThan(0.5);
    });

    it("should give score greater than zero for description match", () => {
      // Arrange
      const product = {
        title: "Product",
        description: "Wireless headphones with noise cancellation",
      };
      const query = "wireless";
      const parsed = parseSearchQuery(query);

      // Act
      const score = calculateRelevanceScore(product, query, parsed);

      // Assert
      expect(score).toBeGreaterThan(0);
    });

    it("should give score less than 0.5 for description match only", () => {
      // Arrange
      const product = {
        title: "Product",
        description: "Wireless headphones with noise cancellation",
      };
      const query = "wireless";
      const parsed = parseSearchQuery(query);

      // Act
      const score = calculateRelevanceScore(product, query, parsed);

      // Assert
      expect(score).toBeLessThan(0.5);
    });

    it("should give high score for SKU match", () => {
      // Arrange
      const product = {
        title: "Product",
        description: "Some description",
      };
      const query = "WH-001";
      const parsed = parseSearchQuery(query);
      const sku = "WH-001-BLK";

      // Act
      const score = calculateRelevanceScore(product, query, parsed, sku);

      // Assert
      expect(score).toBeGreaterThan(0.8);
    });

    it("should combine multiple factors for higher score", () => {
      // Arrange
      const product = {
        title: "Wireless Headphones",
        description: "Wireless bluetooth headphones",
      };
      const query = "wireless";
      const parsed = parseSearchQuery(query);

      // Act
      const score = calculateRelevanceScore(product, query, parsed);

      // Assert
      expect(score).toBeGreaterThan(0.5);
    });
  });
});

