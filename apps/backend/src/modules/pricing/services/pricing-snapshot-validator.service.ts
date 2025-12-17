import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PricingSnapshot } from "../engine/pricing-engine.types";

@Injectable()
export class PricingSnapshotValidator {
  private readonly logger = new Logger(PricingSnapshotValidator.name);

  /**
   * Validate pricing snapshot integrity
   * Ensures snapshot is complete and valid before order creation
   */
  validate(snapshot: PricingSnapshot | null | undefined): void {
    if (!snapshot) {
      throw new BadRequestException(
        "Pricing snapshot is required for order creation",
      );
    }

    // Validate required fields
    if (!snapshot.engineVersion) {
      throw new BadRequestException("Pricing snapshot missing engineVersion");
    }

    if (!snapshot.rulesetVersion) {
      throw new BadRequestException("Pricing snapshot missing rulesetVersion");
    }

    if (!snapshot.computedAt) {
      throw new BadRequestException(
        "Pricing snapshot missing computedAt timestamp",
      );
    }

    if (!snapshot.ruleHash) {
      throw new BadRequestException("Pricing snapshot missing ruleHash");
    }

    // Validate variant prices
    if (!snapshot.variantPrices || snapshot.variantPrices.length === 0) {
      throw new BadRequestException("Pricing snapshot missing variant prices");
    }

    // Validate totals
    if (snapshot.totalBasePrice < 0) {
      throw new BadRequestException(
        "Pricing snapshot has invalid totalBasePrice",
      );
    }

    if (snapshot.totalEffectivePrice < 0) {
      throw new BadRequestException(
        "Pricing snapshot has invalid totalEffectivePrice",
      );
    }

    // Validate variant prices consistency
    let calculatedBaseTotal = 0;
    let calculatedEffectiveTotal = 0;

    for (const variantPrice of snapshot.variantPrices) {
      if (variantPrice.basePrice < 0) {
        throw new BadRequestException(
          `Variant ${variantPrice.variantId} has invalid basePrice`,
        );
      }

      if (variantPrice.effectivePrice < 0) {
        throw new BadRequestException(
          `Variant ${variantPrice.variantId} has invalid effectivePrice`,
        );
      }

      calculatedBaseTotal += variantPrice.basePrice;
      calculatedEffectiveTotal += variantPrice.effectivePrice;
    }

    // Allow small rounding differences (1 paisa tolerance)
    const basePriceDiff = Math.abs(
      calculatedBaseTotal - snapshot.totalBasePrice,
    );
    const effectivePriceDiff = Math.abs(
      calculatedEffectiveTotal - snapshot.totalEffectivePrice,
    );

    if (basePriceDiff > 0.01) {
      this.logger.warn(
        `Pricing snapshot base price mismatch: ${snapshot.totalBasePrice} vs calculated ${calculatedBaseTotal}`,
      );
    }

    if (effectivePriceDiff > 0.01) {
      this.logger.warn(
        `Pricing snapshot effective price mismatch: ${snapshot.totalEffectivePrice} vs calculated ${calculatedEffectiveTotal}`,
      );
    }
  }

  /**
   * Validate snapshot matches payment amount (within tolerance)
   */
  validatePaymentAmount(
    snapshot: PricingSnapshot,
    paymentAmount: number,
    tolerance = 0.01,
  ): void {
    const difference = Math.abs(snapshot.totalEffectivePrice - paymentAmount);

    if (difference > tolerance) {
      throw new BadRequestException(
        `Pricing snapshot total (${snapshot.totalEffectivePrice}) does not match payment amount (${paymentAmount}). Difference: ${difference}`,
      );
    }
  }
}
