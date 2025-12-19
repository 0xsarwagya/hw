import { DiscountType } from "../dto/create-discount.dto";
import { applyCartDiscounts } from "./cart-discount-applier";
import { resolveConflicts } from "./conflict-resolver";
import {
  DiscountEngineInput,
  DiscountEngineResult,
  DiscountStep,
} from "./discount-engine.types";
import {
  createConflictResolutionStep,
  createFilteredDiscountStep,
  createInitialDiscountStep,
  createUndiscountedLineItems,
} from "./discount-result.helper";
import { validateDiscounts } from "./discount-validator";
import { applyProductDiscounts } from "./product-discount-applier";
import { ensureNonNegative, roundToTwoDecimals } from "./rounding.utils";
import { applyTieredAndBogo } from "./tiered-bogo-applier";

/**
 * Main discount engine function
 *
 * This is a pure function: takes input, returns deterministic output.
 * Never touches DB/Redis - all data must be pre-fetched.
 *
 * **Processing order is critical:**
 * 1. Product-level discounts (applied first to individual line items)
 * 2. Tiered/BOGO discounts (quantity-based, applied after product discounts)
 * 3. Cart-level discounts (applied last, on final subtotal)
 *
 * This order ensures discounts compound correctly and tiered discounts
 * work on already-discounted prices. For example, a "Buy 3+ get 20% off" discount
 * applies to the price after product-level discounts, not the original price.
 *
 * @param input - Discount engine input containing:
 *   - `cart`: Cart items with product information
 *   - `discounts`: Available discounts (should be pre-filtered for eligibility)
 *   - `customer`: Customer information (optional, for customer-specific discounts)
 *   - `now`: Current date for discount validity checks
 * @returns Discount result with:
 *   - `lineItems`: Line items with applied product discounts
 *   - `cartDiscounts`: Applied cart-level discounts
 *   - `subtotal`: Original cart subtotal
 *   - `discountTotal`: Total discount amount
 *   - `total`: Final total after all discounts
 *   - `appliedDiscountIds`: IDs of all applied discounts
 *   - `breakdown`: Step-by-step breakdown of discount application
 *
 * @example
 * ```typescript
 * const result = runDiscountEngine({
 *   cart: {
 *     items: [
 *       { id: "i1", productVariantId: "v1", price: 100, quantity: 2 },
 *     ],
 *   },
 *   discounts: [
 *     {
 *       id: "d1",
 *       code: "SAVE20",
 *       type: DiscountType.PERCENTAGE,
 *       value: 20,
 *       scope: DiscountScope.PRODUCT,
 *       // ... other fields
 *     },
 *   ],
 *   customer: null,
 *   now: new Date(),
 * });
 * // Applies 20% discount to line items, then calculates final total
 * ```
 */
export function runDiscountEngine(
  input: DiscountEngineInput,
): DiscountEngineResult {
  const { cart, discounts } = input;

  const steps: DiscountStep[] = [];
  const initialSubtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  steps.push(createInitialDiscountStep(initialSubtotal));

  // Filter invalid discounts (expired, inactive, etc.)
  // This is a safety net - discounts should already be filtered upstream
  const eligible = validateDiscounts(input);
  steps.push(
    createFilteredDiscountStep(
      discounts.length,
      eligible.length,
      eligible.map((discount) => discount.code),
      initialSubtotal,
    ),
  );

  if (eligible.length === 0) {
    // No discounts, return items as-is
    const lineItems = createUndiscountedLineItems(cart.items);

    return {
      lineItems,
      cartDiscounts: [],
      subtotal: initialSubtotal,
      discountTotal: 0,
      total: initialSubtotal,
      appliedDiscountIds: [],
      breakdown: {
        lineItems,
        cartDiscounts: [],
        stepByStep: steps,
      },
    };
  }

  // Resolve conflicts: handle mutually exclusive discounts and stacking rules
  // Higher priority discounts take precedence, non-stackable discounts can't combine
  const resolved = resolveConflicts(eligible);
  steps.push(
    createConflictResolutionStep(
      resolved.productDiscounts.length,
      resolved.cartDiscounts.length,
      [
        ...resolved.productDiscounts.map((discount) => discount.code),
        ...resolved.cartDiscounts.map((discount) => discount.code),
      ],
      initialSubtotal,
    ),
  );

  // Apply product-level discounts first
  // These modify individual line item prices based on product/category/collection matching
  let lineItems = applyProductDiscounts(cart.items, resolved.productDiscounts);
  const subtotalAfterProduct = lineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  steps.push({
    step: "4",
    description: "Applied product-level discounts",
    discountsApplied: resolved.productDiscounts.map(
      (discount) => discount.code,
    ),
    subtotalAfter: subtotalAfterProduct,
  });

  // Apply tiered discounts and BOGO after product discounts
  // These are quantity-based and work on already-discounted prices
  // Example: "Buy 3+ get 20% off" applies to the discounted price, not original
  lineItems = applyTieredAndBogo(lineItems, resolved);
  const subtotalAfterTiered = lineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  steps.push({
    step: "5",
    description: "Applied tiered pricing and BOGO discounts",
    discountsApplied: [
      ...resolved.productDiscounts
        .filter(
          (discount) =>
            discount.type === DiscountType.TIERED ||
            discount.type === DiscountType.BUY_X_GET_Y,
        )
        .map((discount) => discount.code),
    ],
    subtotalAfter: subtotalAfterTiered,
  });

  // Recompute subtotal after product/tiered discounts
  // Cart-level discounts are applied to this subtotal, not the original
  const subtotal = roundToTwoDecimals(subtotalAfterTiered);

  // Apply cart-level discounts last
  // These are applied to the entire cart subtotal (after product discounts)
  // Example: "10% off entire order" applies to the discounted subtotal
  const { cartDiscounts, subtotalAfterCartDiscounts } = applyCartDiscounts(
    subtotal,
    resolved.cartDiscounts,
  );
  steps.push({
    step: "6",
    description: "Applied cart-level discounts",
    discountsApplied: cartDiscounts.map(
      (cartDiscount) => cartDiscount.discountCode,
    ),
    subtotalAfter: subtotalAfterCartDiscounts,
  });

  // Build final totals: ensure non-negative (discounts can't make total negative)
  const total = ensureNonNegative(
    roundToTwoDecimals(subtotalAfterCartDiscounts),
  );
  const discountTotal = roundToTwoDecimals(initialSubtotal - total);

  // Collect all applied discount IDs for tracking/analytics
  const appliedDiscountIds = [
    ...new Set([
      ...lineItems.flatMap((item) =>
        item.discounts.map((discount) => discount.discountId),
      ),
      ...cartDiscounts.map((cartDiscount) => cartDiscount.discountId),
    ]),
  ];

  steps.push({
    step: "7",
    description: "Final totals calculated",
    discountsApplied: appliedDiscountIds,
    subtotalAfter: total,
  });

  return {
    lineItems,
    cartDiscounts,
    subtotal: initialSubtotal,
    discountTotal,
    total,
    appliedDiscountIds,
    breakdown: {
      lineItems,
      cartDiscounts,
      stepByStep: steps,
    },
  };
}
