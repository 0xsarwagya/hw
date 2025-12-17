import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountEngineInput } from "./discount-engine.types";

/**
 * Validate discounts against cart and customer context
 * This is a safety net - discounts should be pre-filtered by parent service
 */
export function validateDiscounts(
  input: DiscountEngineInput,
): DiscountResponseDto[] {
  const { cart, customer, discounts, now } = input;
  const eligible: DiscountResponseDto[] = [];

  // Calculate cart subtotal for minOrderAmount checks
  const cartSubtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Parse customer group IDs
  const customerGroupIds = customer?.customerGroupIds || [];

  for (const discount of discounts) {
    try {
      // Check if discount is active
      if (!discount.isActive) {
        continue;
      }

      // Check date validity
      const startDate = new Date(discount.startDate);
      const endDate = discount.endDate ? new Date(discount.endDate) : null;

      if (startDate > now) {
        continue; // Discount hasn't started yet
      }

      if (endDate && endDate < now) {
        continue; // Discount has expired
      }

      // Check minimum order amount
      if (discount.minOrderAmount && cartSubtotal < discount.minOrderAmount) {
        continue;
      }

      // Check customer group restrictions
      if (discount.customerGroupIds) {
        try {
          const allowedGroups = JSON.parse(discount.customerGroupIds);
          if (
            customerGroupIds.length > 0 &&
            !customerGroupIds.some((id) => allowedGroups.includes(id))
          ) {
            continue; // Customer not in allowed groups
          }
        } catch {
          // Invalid JSON, skip customer group check
        }
      }

      // Check minimum quantity (for product-level discounts)
      if (discount.minQuantity) {
        const totalQuantity = cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        if (totalQuantity < discount.minQuantity) {
          continue;
        }
      }

      // All checks passed
      eligible.push(discount);
    } catch {}
  }

  return eligible;
}
