import {
  calculateCgstSgst,
  calculateCompleteOrderGst,
  calculateGstAmount,
  calculateGstBreakdown,
  calculateGstFromInclusivePrice,
  calculateIgst,
  calculateOrderGst,
  calculatePriceWithGst,
  calculateBasePrice,
  calculateShippingGst,
  formatGstRate,
  getGstRateForCategory,
  getStateCodeFromGstin,
  isIntraStateTransaction,
  isValidGstRate,
  validateGstinFormat,
  VALID_GST_RATES,
  ValidGstRate,
  GST_RATES_BY_CATEGORY,
  ProductCategory,
} from "./gst.utils";

describe("GST Utils", () => {
  describe("VALID_GST_RATES", () => {
    it("should contain valid Indian GST rates", () => {
      expect(VALID_GST_RATES).toEqual([0, 5, 12, 18, 28]);
    });
  });

  describe("isValidGstRate", () => {
    it("should return true for GST rate 0", () => {
      // Arrange
      const rate = 0;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for GST rate 5", () => {
      // Arrange
      const rate = 5;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for GST rate 12", () => {
      // Arrange
      const rate = 12;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for GST rate 18", () => {
      // Arrange
      const rate = 18;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for GST rate 28", () => {
      // Arrange
      const rate = 28;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for invalid GST rate 10", () => {
      // Arrange
      const rate = 10;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid GST rate 15", () => {
      // Arrange
      const rate = 15;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid GST rate 25", () => {
      // Arrange
      const rate = 25;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for negative GST rate", () => {
      // Arrange
      const rate = -5;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for GST rate exceeding maximum", () => {
      // Arrange
      const rate = 100;

      // Act
      const result = isValidGstRate(rate);

      // Assert
      expect(result).toBe(false);
    });

    it("should narrow type to ValidGstRate when rate is valid", () => {
      // Arrange
      const rate: number = 18;

      // Act & Assert
      if (isValidGstRate(rate)) {
        const validRate: ValidGstRate = rate; // Type should be narrowed
        expect(validRate).toBe(18);
      }
    });
  });

  describe("calculateGstAmount", () => {
    it("should calculate GST amount for 18% rate on 100", () => {
      // Arrange
      const baseAmount = 100;
      const gstRate = 18;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBe(18);
    });

    it("should calculate GST amount for 12% rate on 500", () => {
      // Arrange
      const baseAmount = 500;
      const gstRate = 12;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBe(60);
    });

    it("should calculate GST amount for 28% rate on 1000", () => {
      // Arrange
      const baseAmount = 1000;
      const gstRate = 28;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBe(280);
    });

    it("should calculate GST amount for 5% rate on 200", () => {
      // Arrange
      const baseAmount = 200;
      const gstRate = 5;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBe(10);
    });

    it("should return zero GST amount for 0% rate", () => {
      // Arrange
      const baseAmount = 50;
      const gstRate = 0;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBe(0);
    });

    it("should handle decimal amounts with 18% rate", () => {
      // Arrange
      const baseAmount = 99.99;
      const gstRate = 18;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBeCloseTo(17.9982, 4);
    });

    it("should handle decimal amounts with 12% rate", () => {
      // Arrange
      const baseAmount = 123.45;
      const gstRate = 12;

      // Act
      const result = calculateGstAmount(baseAmount, gstRate);

      // Assert
      expect(result).toBeCloseTo(14.814, 3);
    });

    it("should throw error when GST rate is negative", () => {
      // Arrange
      const baseAmount = 100;
      const invalidGstRate = -5;

      // Act & Assert
      expect(() => calculateGstAmount(baseAmount, invalidGstRate)).toThrow(
        "GST rate must be between 0 and 100",
      );
    });

    it("should throw error when GST rate exceeds 100", () => {
      // Arrange
      const baseAmount = 100;
      const invalidGstRate = 150;

      // Act & Assert
      expect(() => calculateGstAmount(baseAmount, invalidGstRate)).toThrow(
        "GST rate must be between 0 and 100",
      );
    });
  });

  describe("calculatePriceWithGst", () => {
    it("should calculate price including GST", () => {
      expect(calculatePriceWithGst(100, 18)).toBe(118);
      expect(calculatePriceWithGst(500, 12)).toBe(560);
      expect(calculatePriceWithGst(1000, 28)).toBe(1280);
      expect(calculatePriceWithGst(200, 5)).toBe(210);
      expect(calculatePriceWithGst(50, 0)).toBe(50);
    });

    it("should handle decimal amounts", () => {
      expect(calculatePriceWithGst(99.99, 18)).toBeCloseTo(118, 0);
      expect(calculatePriceWithGst(123.45, 12)).toBeCloseTo(138.26, 2);
    });
  });

  describe("calculateBasePrice", () => {
    it("should calculate base price from GST-inclusive price", () => {
      expect(calculateBasePrice(118, 18)).toBeCloseTo(100, 2);
      expect(calculateBasePrice(560, 12)).toBeCloseTo(500, 2);
      expect(calculateBasePrice(1280, 28)).toBeCloseTo(1000, 2);
      expect(calculateBasePrice(210, 5)).toBeCloseTo(200, 2);
      expect(calculateBasePrice(50, 0)).toBe(50);
    });

    it("should handle decimal amounts", () => {
      expect(calculateBasePrice(117.9982, 18)).toBeCloseTo(99.99, 1);
      expect(calculateBasePrice(138.264, 12)).toBeCloseTo(123.45, 1);
    });

    it("should throw error for invalid GST rates", () => {
      expect(() => calculateBasePrice(118, -5)).toThrow("GST rate must be between 0 and 100");
      expect(() => calculateBasePrice(118, 150)).toThrow("GST rate must be between 0 and 100");
    });
  });

  describe("calculateGstFromInclusivePrice", () => {
    it("should calculate GST amount from GST-inclusive price", () => {
      expect(calculateGstFromInclusivePrice(118, 18)).toBeCloseTo(18, 2);
      expect(calculateGstFromInclusivePrice(560, 12)).toBeCloseTo(60, 2);
      expect(calculateGstFromInclusivePrice(1280, 28)).toBeCloseTo(280, 2);
      expect(calculateGstFromInclusivePrice(210, 5)).toBeCloseTo(10, 2);
      expect(calculateGstFromInclusivePrice(50, 0)).toBe(0);
    });

    it("should handle decimal amounts", () => {
      expect(calculateGstFromInclusivePrice(117.9982, 18)).toBeCloseTo(17.9982, 2);
      expect(calculateGstFromInclusivePrice(138.264, 12)).toBeCloseTo(14.814, 2);
    });
  });

  describe("formatGstRate", () => {
    it("should format GST rate for display", () => {
      expect(formatGstRate(18)).toBe("18%");
      expect(formatGstRate(12)).toBe("12%");
      expect(formatGstRate(0)).toBe("0%");
      expect(formatGstRate(5.5)).toBe("5.5%");
    });
  });

  describe("calculateCgstSgst", () => {
    it("should calculate CGST and SGST correctly", () => {
      const result = calculateCgstSgst(100, 18);
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);

      const result2 = calculateCgstSgst(500, 12);
      expect(result2.cgst).toBe(30);
      expect(result2.sgst).toBe(30);

      const result3 = calculateCgstSgst(1000, 28);
      expect(result3.cgst).toBe(140);
      expect(result3.sgst).toBe(140);
    });

    it("should handle odd GST amounts by rounding", () => {
      const result = calculateCgstSgst(99.99, 18);
      expect(result.cgst).toBeCloseTo(9, 0);
      expect(result.sgst).toBeCloseTo(9, 0);
    });
  });

  describe("calculateIgst", () => {
    it("should calculate IGST correctly", () => {
      expect(calculateIgst(100, 18)).toBe(18);
      expect(calculateIgst(500, 12)).toBe(60);
      expect(calculateIgst(1000, 28)).toBe(280);
      expect(calculateIgst(200, 5)).toBe(10);
      expect(calculateIgst(50, 0)).toBe(0);
    });

    it("should handle decimal amounts", () => {
      expect(calculateIgst(99.99, 18)).toBeCloseTo(18, 0);
      expect(calculateIgst(123.45, 12)).toBeCloseTo(14.814, 2);
    });
  });

  describe("isIntraStateTransaction", () => {
    it("should return true for same state transactions", () => {
      expect(isIntraStateTransaction("Maharashtra", "Maharashtra")).toBe(true);
      expect(isIntraStateTransaction("Delhi", "Delhi")).toBe(true);
      expect(isIntraStateTransaction("Karnataka", "Karnataka")).toBe(true);
    });

    it("should return false for different state transactions", () => {
      expect(isIntraStateTransaction("Maharashtra", "Delhi")).toBe(false);
      expect(isIntraStateTransaction("Delhi", "Karnataka")).toBe(false);
      expect(isIntraStateTransaction("Maharashtra", "Karnataka")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isIntraStateTransaction("MAHARASHTRA", "maharashtra")).toBe(true);
      expect(isIntraStateTransaction("Delhi", "delhi")).toBe(true);
    });

    it("should handle whitespace", () => {
      expect(isIntraStateTransaction(" Maharashtra ", " maharashtra ")).toBe(true);
      expect(isIntraStateTransaction("Delhi", " delhi ")).toBe(true);
    });

    it("should return false if states are not provided", () => {
      expect(isIntraStateTransaction("", "Delhi")).toBe(false);
      expect(isIntraStateTransaction("Maharashtra", "")).toBe(false);
      expect(isIntraStateTransaction("", "")).toBe(false);
    });
  });

  describe("calculateGstBreakdown", () => {
    describe("Intra-state transactions (same state)", () => {
      it("should calculate CGST/SGST breakdown for same state", () => {
        const result = calculateGstBreakdown(100, 18, "Maharashtra", "Maharashtra");

        expect(result.cgst).toBe(9);
        expect(result.sgst).toBe(9);
        expect(result.igst).toBe(0);
        expect(result.totalGst).toBe(18);
        expect(result.isIntraState).toBe(true);
      });

      it("should handle different GST rates for same state", () => {
        const result = calculateGstBreakdown(500, 12, "Delhi", "Delhi");

        expect(result.cgst).toBe(30);
        expect(result.sgst).toBe(30);
        expect(result.igst).toBe(0);
        expect(result.totalGst).toBe(60);
        expect(result.isIntraState).toBe(true);
      });
    });

    describe("Inter-state transactions (different states)", () => {
      it("should calculate IGST breakdown for different states", () => {
        const result = calculateGstBreakdown(100, 18, "Maharashtra", "Delhi");

        expect(result.cgst).toBe(0);
        expect(result.sgst).toBe(0);
        expect(result.igst).toBe(18);
        expect(result.totalGst).toBe(18);
        expect(result.isIntraState).toBe(false);
      });

      it("should handle different GST rates for different states", () => {
        const result = calculateGstBreakdown(1000, 28, "Karnataka", "Maharashtra");

        expect(result.cgst).toBe(0);
        expect(result.sgst).toBe(0);
        expect(result.igst).toBe(280);
        expect(result.totalGst).toBe(280);
        expect(result.isIntraState).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle zero GST rate", () => {
        const result = calculateGstBreakdown(100, 0, "Maharashtra", "Delhi");

        expect(result.cgst).toBe(0);
        expect(result.sgst).toBe(0);
        expect(result.igst).toBe(0);
        expect(result.totalGst).toBe(0);
        expect(result.isIntraState).toBe(false);
      });

      it("should handle missing states as inter-state", () => {
        const result = calculateGstBreakdown(100, 18, "", "Delhi");

        expect(result.cgst).toBe(0);
        expect(result.sgst).toBe(0);
        expect(result.igst).toBe(18);
        expect(result.totalGst).toBe(18);
        expect(result.isIntraState).toBe(false);
      });

      it("should be case insensitive for states", () => {
        const result = calculateGstBreakdown(100, 18, "MAHARASHTRA", "maharashtra");

        expect(result.cgst).toBe(9);
        expect(result.sgst).toBe(9);
        expect(result.igst).toBe(0);
        expect(result.totalGst).toBe(18);
        expect(result.isIntraState).toBe(true);
      });
    });
  });

  describe("Integration scenarios", () => {
    describe("Complete GST calculation flow", () => {
      it("should calculate complete GST for intra-state transaction", () => {
        const basePrice = 1000;
        const gstRate = 18;
        const sellerState = "Maharashtra";
        const buyerState = "Maharashtra";

        // Calculate GST breakdown
        const breakdown = calculateGstBreakdown(basePrice, gstRate, sellerState, buyerState);

        // Calculate final price
        const finalPrice = calculatePriceWithGst(basePrice, gstRate);

        expect(breakdown.isIntraState).toBe(true);
        expect(breakdown.cgst).toBe(90); // 1000 * 18/100 / 2 = 90
        expect(breakdown.sgst).toBe(90);
        expect(breakdown.igst).toBe(0);
        expect(breakdown.totalGst).toBe(180);
        expect(finalPrice).toBe(1180);
      });

      it("should calculate complete GST for inter-state transaction", () => {
        const basePrice = 1000;
        const gstRate = 18;
        const sellerState = "Maharashtra";
        const buyerState = "Delhi";

        // Calculate GST breakdown
        const breakdown = calculateGstBreakdown(basePrice, gstRate, sellerState, buyerState);

        // Calculate final price
        const finalPrice = calculatePriceWithGst(basePrice, gstRate);

        expect(breakdown.isIntraState).toBe(false);
        expect(breakdown.cgst).toBe(0);
        expect(breakdown.sgst).toBe(0);
        expect(breakdown.igst).toBe(180); // 1000 * 18/100 = 180
        expect(breakdown.totalGst).toBe(180);
        expect(finalPrice).toBe(1180);
      });
    });

    describe("Reverse calculations", () => {
      it("should reverse calculate from GST-inclusive price", () => {
        const priceWithGst = 1180;
        const gstRate = 18;

        // Calculate base price
        const basePrice = calculateBasePrice(priceWithGst, gstRate);

        // Calculate GST from inclusive price
        const gstFromInclusive = calculateGstFromInclusivePrice(priceWithGst, gstRate);

        expect(basePrice).toBeCloseTo(1000, 2);
        expect(gstFromInclusive).toBeCloseTo(180, 2);
        expect(basePrice + gstFromInclusive).toBeCloseTo(priceWithGst, 2);
      });
    });
  });

  describe("GST_RATES_BY_CATEGORY", () => {
    it("should contain correct GST rates for different categories", () => {
      expect(GST_RATES_BY_CATEGORY.essential).toBe(0);
      expect(GST_RATES_BY_CATEGORY.standard).toBe(5);
      expect(GST_RATES_BY_CATEGORY.luxury).toBe(12);
      expect(GST_RATES_BY_CATEGORY.services).toBe(18);
      expect(GST_RATES_BY_CATEGORY.luxury_services).toBe(28);
    });
  });

  describe("getGstRateForCategory", () => {
    it("should return correct GST rate for each category", () => {
      expect(getGstRateForCategory("essential")).toBe(0);
      expect(getGstRateForCategory("standard")).toBe(5);
      expect(getGstRateForCategory("luxury")).toBe(12);
      expect(getGstRateForCategory("services")).toBe(18);
      expect(getGstRateForCategory("luxury_services")).toBe(28);
    });

    it("should return valid GST rates", () => {
      const categories: ProductCategory[] = ["essential", "standard", "luxury", "services", "luxury_services"];

      categories.forEach(category => {
        const rate = getGstRateForCategory(category);
        expect(isValidGstRate(rate)).toBe(true);
      });
    });
  });

  describe("calculateOrderGst", () => {
    const mockItems = [
      { basePrice: 100, quantity: 2, gstRate: 18 }, // 200 * 18% = 36 GST
      { basePrice: 500, quantity: 1, gstRate: 12 }, // 500 * 12% = 60 GST
    ];

    describe("Intra-state transactions", () => {
      it("should calculate CGST/SGST breakdown for order items", () => {
        const result = calculateOrderGst(mockItems, "Maharashtra", "Maharashtra");

        expect(result.totalBaseAmount).toBe(700); // 200 + 500
        expect(result.totalGstAmount).toBe(96); // 36 + 60

        // CGST/SGST split: 36/2 = 18 each for first item, 60/2 = 30 each for second
        expect(result.gstBreakdown.cgst).toBe(48); // 18 + 30
        expect(result.gstBreakdown.sgst).toBe(48); // 18 + 30
        expect(result.gstBreakdown.igst).toBe(0);

        expect(result.itemBreakdowns).toHaveLength(2);
        expect(result.itemBreakdowns[0].baseAmount).toBe(200);
        expect(result.itemBreakdowns[0].gstAmount).toBe(36);
        expect(result.itemBreakdowns[0].gstBreakdown.cgst).toBe(18);
        expect(result.itemBreakdowns[0].gstBreakdown.sgst).toBe(18);

        expect(result.itemBreakdowns[1].baseAmount).toBe(500);
        expect(result.itemBreakdowns[1].gstAmount).toBe(60);
        expect(result.itemBreakdowns[1].gstBreakdown.cgst).toBe(30);
        expect(result.itemBreakdowns[1].gstBreakdown.sgst).toBe(30);
      });
    });

    describe("Inter-state transactions", () => {
      it("should calculate IGST breakdown for order items", () => {
        const result = calculateOrderGst(mockItems, "Maharashtra", "Delhi");

        expect(result.totalBaseAmount).toBe(700);
        expect(result.totalGstAmount).toBe(96);

        expect(result.gstBreakdown.cgst).toBe(0);
        expect(result.gstBreakdown.sgst).toBe(0);
        expect(result.gstBreakdown.igst).toBe(96); // 36 + 60

        expect(result.itemBreakdowns[0].gstBreakdown.igst).toBe(36);
        expect(result.itemBreakdowns[1].gstBreakdown.igst).toBe(60);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty items array", () => {
        const result = calculateOrderGst([], "Maharashtra", "Delhi");

        expect(result.totalBaseAmount).toBe(0);
        expect(result.totalGstAmount).toBe(0);
        expect(result.gstBreakdown.cgst).toBe(0);
        expect(result.gstBreakdown.sgst).toBe(0);
        expect(result.gstBreakdown.igst).toBe(0);
        expect(result.itemBreakdowns).toHaveLength(0);
      });

      it("should handle zero quantity items", () => {
        const zeroQuantityItems = [{ basePrice: 100, quantity: 0, gstRate: 18 }];
        const result = calculateOrderGst(zeroQuantityItems, "Maharashtra", "Maharashtra");

        expect(result.totalBaseAmount).toBe(0);
        expect(result.totalGstAmount).toBe(0);
      });
    });
  });

  describe("calculateShippingGst", () => {
    it("should calculate 18% IGST for shipping", () => {
      const result = calculateShippingGst(100);

      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBe(18);
      expect(result.igst).toBe(18);
    });

    it("should handle zero shipping amount", () => {
      const result = calculateShippingGst(0);

      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBe(0);
      expect(result.igst).toBe(0);
    });

    it("should handle decimal shipping amounts", () => {
      const result = calculateShippingGst(99.99);

      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBeCloseTo(17.9982, 4);
      expect(result.igst).toBeCloseTo(17.9982, 4);
    });
  });

  describe("calculateCompleteOrderGst", () => {
    const mockProductItems = [
      { basePrice: 1000, quantity: 1, gstRate: 18 }, // 1000 * 18% = 180 GST
    ];

    describe("Intra-state transactions with shipping", () => {
      it("should calculate complete GST including products and shipping", () => {
        const result = calculateCompleteOrderGst(mockProductItems, 100, "Maharashtra", "Maharashtra");

        // Products: 1000 base, 180 GST (90 CGST + 90 SGST)
        expect(result.products.totalBaseAmount).toBe(1000);
        expect(result.products.totalGstAmount).toBe(180);
        expect(result.products.gstBreakdown.cgst).toBe(90);
        expect(result.products.gstBreakdown.sgst).toBe(90);
        expect(result.products.gstBreakdown.igst).toBe(0);

        // Shipping: 100 base, 18 GST (IGST only)
        expect(result.shipping.baseAmount).toBe(100);
        expect(result.shipping.gstRate).toBe(18);
        expect(result.shipping.gstAmount).toBe(18);
        expect(result.shipping.igst).toBe(18);

        // Totals
        expect(result.totals.totalBaseAmount).toBe(1100); // 1000 + 100
        expect(result.totals.totalGstAmount).toBe(198); // 180 + 18
        expect(result.totals.totalAmountWithGst).toBe(1298); // 1100 + 198
        expect(result.totals.gstBreakdown.cgst).toBe(90);
        expect(result.totals.gstBreakdown.sgst).toBe(90);
        expect(result.totals.gstBreakdown.igst).toBe(18); // Only shipping
      });
    });

    describe("Inter-state transactions with shipping", () => {
      it("should calculate complete GST for inter-state with shipping", () => {
        const result = calculateCompleteOrderGst(mockProductItems, 100, "Maharashtra", "Delhi");

        // Products: 1000 base, 180 GST (IGST only)
        expect(result.products.gstBreakdown.cgst).toBe(0);
        expect(result.products.gstBreakdown.sgst).toBe(0);
        expect(result.products.gstBreakdown.igst).toBe(180);

        // Shipping: 100 base, 18 GST (IGST)
        expect(result.shipping.igst).toBe(18);

        // Totals
        expect(result.totals.totalGstAmount).toBe(198);
        expect(result.totals.gstBreakdown.cgst).toBe(0);
        expect(result.totals.gstBreakdown.sgst).toBe(0);
        expect(result.totals.gstBreakdown.igst).toBe(198); // 180 + 18
      });
    });

    describe("Free shipping scenarios", () => {
      it("should handle zero shipping cost", () => {
        const result = calculateCompleteOrderGst(mockProductItems, 0, "Maharashtra", "Maharashtra");

        expect(result.shipping.baseAmount).toBe(0);
        expect(result.shipping.gstAmount).toBe(0);
        expect(result.totals.totalBaseAmount).toBe(1000);
        expect(result.totals.totalGstAmount).toBe(180);
        expect(result.totals.gstBreakdown.igst).toBe(0); // No shipping GST
      });
    });
  });

  describe("GSTIN validation", () => {
    describe("validateGstinFormat", () => {
      it("should validate correct GSTIN format", () => {
        // Valid GSTIN: 22AAAAA0000A1Z5
        expect(validateGstinFormat("22AAAAA0000A1Z5")).toBe(true);
        expect(validateGstinFormat("07AACCM1234F1Z8")).toBe(true);
        expect(validateGstinFormat("29ABCDE1234F1Z0")).toBe(true);
      });

      it("should reject invalid GSTIN formats", () => {
        expect(validateGstinFormat("")).toBe(false);
        expect(validateGstinFormat("123")).toBe(false);
        expect(validateGstinFormat("22AAAAA0000A1Z")).toBe(false); // Too short
        expect(validateGstinFormat("22AAAAA0000A1Z55")).toBe(false); // Too long
        expect(validateGstinFormat("XXAAAAA0000A1Z5")).toBe(false); // Invalid state code
        expect(validateGstinFormat("22AAAAA0000A1Z5")).toBe(true); // Valid
      });

      it("should be case insensitive", () => {
        expect(validateGstinFormat("22aaaaa0000a1z5")).toBe(true);
        expect(validateGstinFormat("22AAAAA0000a1Z5")).toBe(true);
      });
    });

    describe("getStateCodeFromGstin", () => {
      it("should extract state code from valid GSTIN", () => {
        expect(getStateCodeFromGstin("22AAAAA0000A1Z5")).toBe("22");
        expect(getStateCodeFromGstin("07AACCM1234F1Z8")).toBe("07");
        expect(getStateCodeFromGstin("29ABCDE1234F1Z0")).toBe("29");
      });

      it("should return null for invalid GSTIN", () => {
        expect(getStateCodeFromGstin("")).toBe(null);
        expect(getStateCodeFromGstin("123")).toBe(null);
        expect(getStateCodeFromGstin("XXAAAAA0000A1Z5")).toBe(null);
      });
    });
  });

  describe("Real-world scenarios", () => {
    describe("E-commerce order calculation", () => {
      it("should calculate GST for a complete online shopping order", () => {
        // Sample order: Laptop (electronics), Book (essential), Headphones (electronics)
        const orderItems = [
          { basePrice: 50000, quantity: 1, gstRate: 18 }, // Laptop
          { basePrice: 500, quantity: 1, gstRate: 0 },    // Book (essential)
          { basePrice: 3000, quantity: 1, gstRate: 18 },  // Headphones
        ];

        const shippingAmount = 200; // Shipping cost
        const sellerState = "Maharashtra";
        const buyerState = "Maharashtra"; // Same state

        const result = calculateCompleteOrderGst(orderItems, shippingAmount, sellerState, buyerState);

        // Products total base: 50000 + 500 + 3000 = 53500
        expect(result.products.totalBaseAmount).toBe(53500);

        // GST calculation: (50000 * 18%) + (3000 * 18%) = 9000 + 540 = 9540
        expect(result.products.totalGstAmount).toBe(9540);

        // CGST/SGST split: 9540 / 2 = 4770 each
        expect(result.products.gstBreakdown.cgst).toBe(4770);
        expect(result.products.gstBreakdown.sgst).toBe(4770);
        expect(result.products.gstBreakdown.igst).toBe(0);

        // Shipping GST: 200 * 18% = 36 (IGST)
        expect(result.shipping.gstAmount).toBe(36);

        // Grand total
        expect(result.totals.totalBaseAmount).toBe(53700); // 53500 + 200
        expect(result.totals.totalGstAmount).toBe(9576); // 9540 + 36
        expect(result.totals.totalAmountWithGst).toBe(63276); // 53700 + 9576
      });

      it("should handle inter-state e-commerce order", () => {
        const orderItems = [
          { basePrice: 50000, quantity: 1, gstRate: 18 }, // Laptop from Maharashtra
        ];

        const result = calculateCompleteOrderGst(orderItems, 200, "Maharashtra", "Delhi");

        // All GST as IGST
        expect(result.products.gstBreakdown.cgst).toBe(0);
        expect(result.products.gstBreakdown.sgst).toBe(0);
        expect(result.products.gstBreakdown.igst).toBe(9000); // 50000 * 18%

        expect(result.shipping.igst).toBe(36); // 200 * 18%

        expect(result.totals.gstBreakdown.igst).toBe(9036); // 9000 + 36
      });
    });

    describe("GST compliance validation", () => {
      it("should validate business GSTIN for compliance", () => {
        const validGstin = "22AAAAA0000A1Z5"; // Maharashtra GSTIN
        const sellerState = "Maharashtra";
        const buyerState = "Delhi";

        expect(validateGstinFormat(validGstin)).toBe(true);
        expect(getStateCodeFromGstin(validGstin)).toBe("22");

        // GST calculation should work normally
        const result = calculateGstBreakdown(1000, 18, sellerState, buyerState);
        expect(result.isIntraState).toBe(false);
        expect(result.igst).toBe(180);
      });
    });
  });
});
