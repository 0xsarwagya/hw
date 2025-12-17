import { DiscountType } from "../dto/create-discount.dto";
import { applyCartDiscounts } from "./cart-discount-applier";
import { resolveConflicts } from "./conflict-resolver";
import {
  DiscountEngineInput,
  DiscountEngineResult,
  DiscountStep,
} from "./discount-engine.types";
import { validateDiscounts } from "./discount-validator";
import { applyProductDiscounts } from "./product-discount-applier";
import { ensureNonNegative, roundToTwoDecimals } from "./rounding.utils";
import { applyTieredAndBogo } from "./tiered-bogo-applier";

/**
 * Main discount engine function
 * Pure function: takes input, returns deterministic output
 * Never touches DB/Redis - all data must be pre-fetched
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

  steps.push({
    step: "1",
    description: "Initial cart subtotal",
    discountsApplied: [],
    subtotalAfter: initialSubtotal,
  });

  // STEP 1: Filter invalid discounts (safety net)
  const eligible = validateDiscounts(input);
  steps.push({
    step: "2",
    description: `Filtered ${discounts.length} discounts to ${eligible.length} eligible`,
    discountsApplied: eligible.map((d) => d.code),
    subtotalAfter: initialSubtotal,
  });

  if (eligible.length === 0) {
    // No discounts, return items as-is
    const lineItems = cart.items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      productId: item.productId,
      originalPrice: item.price,
      quantity: item.quantity,
      lineTotal: roundToTwoDecimals(item.price * item.quantity),
      discounts: [],
    }));

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

  // STEP 2: Resolve stacking/exclusivity conflicts
  const resolved = resolveConflicts(eligible);
  steps.push({
    step: "3",
    description: `Resolved conflicts: ${resolved.productDiscounts.length} product, ${resolved.cartDiscounts.length} cart discounts`,
    discountsApplied: [
      ...resolved.productDiscounts.map((d) => d.code),
      ...resolved.cartDiscounts.map((d) => d.code),
    ],
    subtotalAfter: initialSubtotal,
  });

  // STEP 3: Apply product-level discounts
  let lineItems = applyProductDiscounts(cart.items, resolved.productDiscounts);
  const subtotalAfterProduct = lineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  steps.push({
    step: "4",
    description: "Applied product-level discounts",
    discountsApplied: resolved.productDiscounts.map((d) => d.code),
    subtotalAfter: subtotalAfterProduct,
  });

  // STEP 4: Apply tiered discounts & BOGO
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
          (d) =>
            d.type === DiscountType.TIERED ||
            d.type === DiscountType.BUY_X_GET_Y,
        )
        .map((d) => d.code),
    ],
    subtotalAfter: subtotalAfterTiered,
  });

  // STEP 5: Recompute subtotal after product/tiered discounts
  const subtotal = roundToTwoDecimals(subtotalAfterTiered);

  // STEP 6: Apply cart-level discounts
  const { cartDiscounts, subtotalAfterCartDiscounts } = applyCartDiscounts(
    subtotal,
    resolved.cartDiscounts,
  );
  steps.push({
    step: "6",
    description: "Applied cart-level discounts",
    discountsApplied: cartDiscounts.map((d) => d.discountCode),
    subtotalAfter: subtotalAfterCartDiscounts,
  });

  // STEP 7: Build final totals & breakdown
  const total = ensureNonNegative(
    roundToTwoDecimals(subtotalAfterCartDiscounts),
  );
  const discountTotal = roundToTwoDecimals(initialSubtotal - total);

  // Collect all applied discount IDs
  const appliedDiscountIds = [
    ...new Set([
      ...lineItems.flatMap((item) => item.discounts.map((d) => d.discountId)),
      ...cartDiscounts.map((d) => d.discountId),
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
