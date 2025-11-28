/**
 * GST (Goods and Services Tax) utility functions
 * Provides helper functions for GST calculations in India
 */

/**
 * Valid GST rates in India (as percentages)
 */
export const VALID_GST_RATES = [0, 5, 12, 18, 28] as const;

export type ValidGstRate = (typeof VALID_GST_RATES)[number];

/**
 * Validate if a GST rate is valid
 * @param rate - GST rate to validate
 * @returns true if rate is valid, false otherwise
 */
export function isValidGstRate(rate: number): rate is ValidGstRate {
  return VALID_GST_RATES.includes(rate as ValidGstRate);
}

/**
 * Calculate GST amount from base price
 * @param basePrice - Price excluding GST
 * @param gstRate - GST rate percentage (e.g., 18 for 18%)
 * @returns GST amount
 */
export function calculateGstAmount(basePrice: number, gstRate: number): number {
  if (gstRate < 0 || gstRate > 100) {
    throw new Error("GST rate must be between 0 and 100");
  }
  return (basePrice * gstRate) / 100;
}

/**
 * Calculate price including GST
 * @param basePrice - Price excluding GST
 * @param gstRate - GST rate percentage (e.g., 18 for 18%)
 * @returns Price including GST
 */
export function calculatePriceWithGst(
  basePrice: number,
  gstRate: number,
): number {
  return basePrice + calculateGstAmount(basePrice, gstRate);
}

/**
 * Calculate base price from GST-inclusive price
 * @param priceWithGst - Price including GST
 * @param gstRate - GST rate percentage (e.g., 18 for 18%)
 * @returns Price excluding GST
 */
export function calculateBasePrice(
  priceWithGst: number,
  gstRate: number,
): number {
  if (gstRate < 0 || gstRate > 100) {
    throw new Error("GST rate must be between 0 and 100");
  }
  return (priceWithGst * 100) / (100 + gstRate);
}

/**
 * Calculate GST amount from GST-inclusive price
 * @param priceWithGst - Price including GST
 * @param gstRate - GST rate percentage (e.g., 18 for 18%)
 * @returns GST amount
 */
export function calculateGstFromInclusivePrice(
  priceWithGst: number,
  gstRate: number,
): number {
  return priceWithGst - calculateBasePrice(priceWithGst, gstRate);
}

/**
 * Format GST rate for display
 * @param rate - GST rate percentage
 * @returns Formatted string (e.g., "18%")
 */
export function formatGstRate(rate: number): string {
  return `${rate}%`;
}

/**
 * Calculate CGST and SGST (for same state transactions)
 * CGST = SGST = GST Rate / 2
 * @param amount - Base amount
 * @param gstRate - GST rate percentage
 * @returns Object with CGST and SGST amounts
 */
export function calculateCgstSgst(
  amount: number,
  gstRate: number,
): {
  cgst: number;
  sgst: number;
} {
  const totalGst = calculateGstAmount(amount, gstRate);
  return {
    cgst: Number((totalGst / 2).toFixed(2)),
    sgst: Number((totalGst / 2).toFixed(2)),
  };
}

/**
 * Calculate IGST (for inter-state transactions)
 * IGST = GST Rate (full amount)
 * @param amount - Base amount
 * @param gstRate - GST rate percentage
 * @returns IGST amount
 */
export function calculateIgst(amount: number, gstRate: number): number {
  return Number(calculateGstAmount(amount, gstRate).toFixed(2));
}

/**
 * Determine if transaction is intra-state (same state) or inter-state
 * @param sellerState - Seller's state
 * @param buyerState - Buyer's state
 * @returns true if same state (intra-state), false if different state (inter-state)
 */
export function isIntraStateTransaction(
  sellerState: string,
  buyerState: string,
): boolean {
  if (!sellerState || !buyerState) {
    return false; // Default to inter-state if states are not provided
  }
  return sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
}

/**
 * GST rates for different product categories (simplified)
 * In real implementation, this would come from a database or configuration
 */
export const GST_RATES_BY_CATEGORY = {
  essential: 0, // Essential goods (food, medicine)
  standard: 5, // Standard goods
  luxury: 12, // Luxury goods
  services: 18, // Services, electronics, appliances
  luxury_services: 28, // Luxury services, cars
} as const;

export type ProductCategory = keyof typeof GST_RATES_BY_CATEGORY;

/**
 * Get GST rate for a product category
 * @param category - Product category
 * @returns GST rate percentage
 */
export function getGstRateForCategory(category: ProductCategory): ValidGstRate {
  return GST_RATES_BY_CATEGORY[category] as ValidGstRate;
}

/**
 * Calculate GST breakdown (CGST/SGST for intra-state, IGST for inter-state)
 * @param amount - Base amount
 * @param gstRate - GST rate percentage
 * @param sellerState - Seller's state
 * @param buyerState - Buyer's state
 * @returns Object with GST breakdown
 */
export function calculateGstBreakdown(
  amount: number,
  gstRate: number,
  sellerState: string,
  buyerState: string,
): {
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  isIntraState: boolean;
} {
  const isIntraState = isIntraStateTransaction(sellerState, buyerState);

  if (isIntraState) {
    const { cgst, sgst } = calculateCgstSgst(amount, gstRate);
    return {
      cgst,
      sgst,
      igst: 0,
      totalGst: cgst + sgst,
      isIntraState: true,
    };
  } else {
    const igst = calculateIgst(amount, gstRate);
    return {
      cgst: 0,
      sgst: 0,
      igst,
      totalGst: igst,
      isIntraState: false,
    };
  }
}

/**
 * Calculate GST for order items (products)
 * @param items - Array of order items
 * @param sellerState - Seller's state
 * @param buyerState - Buyer's state
 * @returns GST breakdown for all items
 */
export function calculateOrderGst(
  items: Array<{
    basePrice: number;
    quantity: number;
    gstRate: number;
  }>,
  sellerState: string,
  buyerState: string,
): {
  totalBaseAmount: number;
  totalGstAmount: number;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  itemBreakdowns: Array<{
    baseAmount: number;
    gstAmount: number;
    gstBreakdown: {
      cgst: number;
      sgst: number;
      igst: number;
    };
  }>;
} {
  const isIntraState = isIntraStateTransaction(sellerState, buyerState);

  let totalBaseAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const itemBreakdowns = items.map((item) => {
    const itemBaseAmount = item.basePrice * item.quantity;
    const itemGstAmount = calculateGstAmount(itemBaseAmount, item.gstRate);

    totalBaseAmount += itemBaseAmount;

    let itemBreakdown: { cgst: number; sgst: number; igst: number };
    if (isIntraState) {
      const { cgst, sgst } = calculateCgstSgst(itemBaseAmount, item.gstRate);
      itemBreakdown = { cgst, sgst, igst: 0 };
      totalCgst += cgst;
      totalSgst += sgst;
    } else {
      const igst = calculateIgst(itemBaseAmount, item.gstRate);
      itemBreakdown = { cgst: 0, sgst: 0, igst };
      totalIgst += igst;
    }

    return {
      baseAmount: itemBaseAmount,
      gstAmount: itemGstAmount,
      gstBreakdown: itemBreakdown,
    };
  });

  return {
    totalBaseAmount,
    totalGstAmount: totalCgst + totalSgst + totalIgst,
    gstBreakdown: {
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
    },
    itemBreakdowns,
  };
}

/**
 * Calculate GST for shipping (typically 18% IGST regardless of states)
 * @param shippingAmount - Shipping amount
 * @returns GST breakdown for shipping
 */
export function calculateShippingGst(shippingAmount: number): {
  gstRate: number;
  gstAmount: number;
  igst: number; // Shipping is always IGST
} {
  const gstRate = 18; // Standard rate for shipping services
  const gstAmount = calculateGstAmount(shippingAmount, gstRate);

  return {
    gstRate,
    gstAmount,
    igst: gstAmount,
  };
}

/**
 * Calculate complete order GST including products and shipping
 * @param productItems - Array of product items
 * @param shippingAmount - Shipping amount (0 if free shipping)
 * @param sellerState - Seller's state
 * @param buyerState - Buyer's state
 * @returns Complete GST calculation for the order
 */
export function calculateCompleteOrderGst(
  productItems: Array<{
    basePrice: number;
    quantity: number;
    gstRate: number;
  }>,
  shippingAmount: number,
  sellerState: string,
  buyerState: string,
): {
  products: {
    totalBaseAmount: number;
    totalGstAmount: number;
    gstBreakdown: {
      cgst: number;
      sgst: number;
      igst: number;
    };
  };
  shipping: {
    baseAmount: number;
    gstRate: number;
    gstAmount: number;
    igst: number;
  };
  totals: {
    totalBaseAmount: number;
    totalGstAmount: number;
    totalAmountWithGst: number;
    gstBreakdown: {
      cgst: number;
      sgst: number;
      igst: number;
    };
  };
} {
  // Calculate GST for products
  const productGst = calculateOrderGst(productItems, sellerState, buyerState);

  // Calculate GST for shipping (always IGST)
  const shippingGst = calculateShippingGst(shippingAmount);

  // Calculate totals
  const totalBaseAmount = productGst.totalBaseAmount + shippingAmount;
  const totalGstAmount = productGst.totalGstAmount + shippingGst.gstAmount;

  return {
    products: productGst,
    shipping: {
      baseAmount: shippingAmount,
      ...shippingGst,
    },
    totals: {
      totalBaseAmount,
      totalGstAmount,
      totalAmountWithGst: totalBaseAmount + totalGstAmount,
      gstBreakdown: {
        cgst: productGst.gstBreakdown.cgst,
        sgst: productGst.gstBreakdown.sgst,
        igst: productGst.gstBreakdown.igst + shippingGst.igst,
      },
    },
  };
}

/**
 * Validate GSTIN format (simplified validation)
 * @param gstin - GSTIN to validate
 * @returns true if valid format, false otherwise
 */
export function validateGstinFormat(gstin: string): boolean {
  // GSTIN format: 2 digits (state code) + 10 chars PAN + 1 entity code + 1 checksum + Z
  // Format: XXAAAAAAAAAAXZX
  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Extract state code from GSTIN
 * @param gstin - GSTIN
 * @returns State code (first 2 digits)
 */
export function getStateCodeFromGstin(gstin: string): string | null {
  if (!validateGstinFormat(gstin)) {
    return null;
  }
  return gstin.substring(0, 2);
}
