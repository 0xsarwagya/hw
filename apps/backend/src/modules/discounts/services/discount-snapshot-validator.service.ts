import { BadRequestException, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountSnapshot } from "../engine/discount-engine.types";
import { computeRuleHash } from "../engine/discount-hash.utils";

@Injectable()
export class DiscountSnapshotValidator {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Validate snapshot integrity
   * Ensures snapshot is valid and matches payment intent amount
   */
  validateSnapshot(
    snapshot: DiscountSnapshot | null,
    appliedDiscounts: DiscountResponseDto[],
    paymentIntentAmount: number,
  ): void {
    if (!snapshot) {
      throw new BadRequestException("Discount snapshot is required");
    }

    // Validate snapshot has required fields
    if (
      !snapshot.appliedDiscountIds ||
      snapshot.appliedDiscountIds.length === 0
    ) {
      // Allow empty if no discounts applied
      if (snapshot.discountTotal !== 0) {
        throw new BadRequestException(
          "Snapshot missing applied discount IDs but has non-zero discount total",
        );
      }
    }

    // Validate totals exist
    if (
      snapshot.subtotal === undefined ||
      snapshot.discountTotal === undefined ||
      snapshot.total === undefined
    ) {
      throw new BadRequestException("Snapshot missing required totals");
    }

    // Validate engine version exists
    if (!snapshot.engineVersion) {
      throw new BadRequestException("Snapshot missing engine version");
    }

    // Validate computedAt timestamp exists
    if (!snapshot.computedAt) {
      throw new BadRequestException("Snapshot missing computedAt timestamp");
    }

    // Validate rule hash exists
    if (!snapshot.ruleHash) {
      throw new BadRequestException("Snapshot missing rule hash");
    }

    // Validate rule hash matches current rules (warn but don't block)
    // Rules may have changed after snapshot creation - this is expected for historical orders
    if (appliedDiscounts.length > 0) {
      const currentHash = computeRuleHash(appliedDiscounts);
      if (snapshot.ruleHash !== currentHash) {
        this.logger.warn(
          `Snapshot rule hash mismatch: ${snapshot.ruleHash} vs ${currentHash}. This is expected for historical orders.`,
        );
      }
    }

    // Validate snapshot totals match payment intent amount (within rounding tolerance)
    const tolerance = 0.01; // 1 paisa tolerance for rounding
    if (Math.abs(snapshot.total - paymentIntentAmount) > tolerance) {
      throw new BadRequestException(
        `Snapshot total (${snapshot.total}) does not match payment intent amount (${paymentIntentAmount}). Difference: ${Math.abs(snapshot.total - paymentIntentAmount)}`,
      );
    }
  }
}
