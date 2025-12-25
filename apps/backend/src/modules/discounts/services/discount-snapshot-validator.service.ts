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
   * Validates snapshot structure and metadata (version, hash, fields)
   * Note: Amount validation should be done separately where actual payment data is available
   */
  validateSnapshot(
    snapshot: DiscountSnapshot | null,
    appliedDiscounts: DiscountResponseDto[],
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

    // Note: Amount validation is not done here because snapshot.total represents
    // subtotal after discounts only, not the full payment amount (which includes
    // GST, shipping, and payment fee). Amount validation should be done where
    // actual payment data is available (e.g., in finalizeOrderFromPayment).
  }
}
