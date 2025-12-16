import {
  calculateOffset,
  calculateTotalPages,
  decodeCursor,
  encodeCursor,
  generateCursor,
  generateCursorPaginationMetadata,
  generatePaginationMetadata,
  normalizePaginationParams,
  parseCursor,
  validatePaginationParams,
} from "./pagination.utils";

describe("Pagination Utils", () => {
  describe("calculateOffset", () => {
    it("should calculate offset correctly", () => {
      expect(calculateOffset(1, 10)).toBe(0);
      expect(calculateOffset(2, 10)).toBe(10);
      expect(calculateOffset(3, 10)).toBe(20);
      expect(calculateOffset(1, 20)).toBe(0);
      expect(calculateOffset(2, 20)).toBe(20);
    });

    it("should handle edge cases", () => {
      expect(calculateOffset(0, 10)).toBe(-10);
      expect(calculateOffset(1, 0)).toBe(0);
    });
  });

  describe("calculateTotalPages", () => {
    it("should calculate total pages correctly", () => {
      expect(calculateTotalPages(100, 10)).toBe(10);
      expect(calculateTotalPages(101, 10)).toBe(11);
      expect(calculateTotalPages(99, 10)).toBe(10);
      expect(calculateTotalPages(0, 10)).toBe(0);
    });

    it("should handle edge cases", () => {
      expect(calculateTotalPages(100, 0)).toBe(0);
      expect(calculateTotalPages(0, 0)).toBe(0);
    });
  });

  describe("validatePaginationParams", () => {
    it("should validate correct parameters", () => {
      const result = validatePaginationParams(1, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject invalid page numbers", () => {
      const result = validatePaginationParams(0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Page must be greater than or equal to 1");
    });

    it("should reject invalid limit values", () => {
      const result = validatePaginationParams(1, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Limit must be greater than or equal to 1");
    });

    it("should reject limit exceeding max", () => {
      const result = validatePaginationParams(1, 101, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Limit must be less than or equal to 100");
    });

    it("should collect multiple errors", () => {
      const result = validatePaginationParams(0, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("normalizePaginationParams", () => {
    it("should normalize valid parameters", () => {
      const result = normalizePaginationParams(2, 20);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(20);
    });

    it("should use defaults for undefined values", () => {
      const result = normalizePaginationParams(undefined, undefined);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should use defaults for invalid values", () => {
      const result = normalizePaginationParams(0, 0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should enforce max limit", () => {
      const result = normalizePaginationParams(1, 200, 1, 10, 100);
      expect(result.limit).toBe(100);
    });

    it("should use custom defaults", () => {
      const result = normalizePaginationParams(undefined, undefined, 2, 20);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe("generatePaginationMetadata", () => {
    it("should generate correct metadata", () => {
      const metadata = generatePaginationMetadata(100, 1, 10);
      expect(metadata.total).toBe(100);
      expect(metadata.page).toBe(1);
      expect(metadata.limit).toBe(10);
      expect(metadata.totalPages).toBe(10);
      expect(metadata.hasNextPage).toBe(true);
      expect(metadata.hasPreviousPage).toBe(false);
    });

    it("should detect last page", () => {
      const metadata = generatePaginationMetadata(100, 10, 10);
      expect(metadata.hasNextPage).toBe(false);
      expect(metadata.hasPreviousPage).toBe(true);
    });

    it("should detect middle page", () => {
      const metadata = generatePaginationMetadata(100, 5, 10);
      expect(metadata.hasNextPage).toBe(true);
      expect(metadata.hasPreviousPage).toBe(true);
    });

    it("should handle empty results", () => {
      const metadata = generatePaginationMetadata(0, 1, 10);
      expect(metadata.totalPages).toBe(0);
      expect(metadata.hasNextPage).toBe(false);
      expect(metadata.hasPreviousPage).toBe(false);
    });
  });

  describe("encodeCursor", () => {
    it("should encode string values", () => {
      const cursor = encodeCursor("test-id");
      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(0);
    });

    it("should encode number values", () => {
      const cursor = encodeCursor(12345);
      expect(typeof cursor).toBe("string");
    });

    it("should encode date values", () => {
      const date = new Date("2024-01-01");
      const cursor = encodeCursor(date);
      expect(typeof cursor).toBe("string");
    });
  });

  describe("decodeCursor", () => {
    it("should decode valid cursor", () => {
      const original = "test-id";
      const cursor = encodeCursor(original);
      const decoded = decodeCursor(cursor);
      expect(decoded).toBe(original);
    });

    it("should throw error for invalid cursor", () => {
      expect(() => decodeCursor("invalid-cursor!!!")).toThrow(
        "Invalid cursor format",
      );
    });
  });

  describe("generateCursor", () => {
    it("should generate cursor from item with id field", () => {
      const item = { id: "test-id", name: "Test" };
      const cursor = generateCursor(item);
      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(0);
    });

    it("should generate cursor from custom field", () => {
      const item = { customId: "custom-id", name: "Test" };
      const cursor = generateCursor(item, "customId");
      expect(typeof cursor).toBe("string");
    });

    it("should throw error for missing field", () => {
      const item = { name: "Test" };
      expect(() => generateCursor(item, "id")).toThrow(
        "Cursor field 'id' not found in item",
      );
    });
  });

  describe("generateCursorPaginationMetadata", () => {
    it("should generate metadata for results with next page", () => {
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
      ];
      const metadata = generateCursorPaginationMetadata(items, 2);
      expect(metadata.hasNextPage).toBe(true);
      expect(metadata.startCursor).toBeDefined();
      expect(metadata.endCursor).toBeDefined();
    });

    it("should generate metadata for results without next page", () => {
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      const metadata = generateCursorPaginationMetadata(items, 10);
      expect(metadata.hasNextPage).toBe(false);
      expect(metadata.startCursor).toBeDefined();
      expect(metadata.endCursor).toBeDefined();
    });

    it("should handle empty results", () => {
      const metadata = generateCursorPaginationMetadata([], 10);
      expect(metadata.hasNextPage).toBe(false);
      expect(metadata.startCursor).toBeUndefined();
      expect(metadata.endCursor).toBeUndefined();
    });
  });

  describe("parseCursor", () => {
    it("should parse id cursor", () => {
      const cursor = encodeCursor("test-id");
      const parsed = parseCursor(cursor, "id");
      expect(parsed).toBe("test-id");
    });

    it("should parse date cursor", () => {
      const date = new Date("2024-01-01");
      const cursor = encodeCursor(date);
      const parsed = parseCursor(cursor, "date");
      expect(parsed).toBeInstanceOf(Date);
      expect((parsed as Date).toISOString()).toBe(date.toISOString());
    });

    it("should parse number cursor", () => {
      const cursor = encodeCursor(12345);
      const parsed = parseCursor(cursor, "number");
      expect(parsed).toBe(12345);
    });

    it("should throw error for invalid number cursor", () => {
      const cursor = encodeCursor("not-a-number");
      expect(() => parseCursor(cursor, "number")).toThrow(
        "Invalid number cursor",
      );
    });
  });
});

