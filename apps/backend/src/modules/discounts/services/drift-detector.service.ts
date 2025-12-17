import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditEventType, DriftSeverity } from "../audit/discount-audit.types";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DISCOUNT_ENGINE_VERSION } from "../engine/discount-engine.constants";
import { DiscountSnapshot } from "../engine/discount-engine.types";
import { computeRuleHash } from "../engine/discount-hash.utils";
import { DiscountAuditService } from "./discount-audit.service";

@Injectable()
export class DriftDetectorService {
  constructor(private readonly auditService: DiscountAuditService) {}

  /**
   * Detect drift during payment intent creation
   * Compares engine output total vs payment intent amount
   */
  async detectPaymentIntentDrift(
    checkoutId: string,
    engineTotal: number,
    paymentIntentAmount: number,
    snapshot: DiscountSnapshot,
  ): Promise<void> {
    const tolerance = 0.01; // 1 paisa tolerance
    const difference = Math.abs(engineTotal - paymentIntentAmount);

    if (difference > tolerance) {
      const driftDetails = {
        reason: "Engine total does not match payment intent amount",
        expected: paymentIntentAmount,
        actual: engineTotal,
        mismatchType: "PAYMENT_INTENT_AMOUNT_MISMATCH",
      };

      await this.auditService.logDrift({
        event: AuditEventType.DRIFT_DETECTED,
        checkoutId,
        computedTotal: engineTotal,
        paymentAmount: paymentIntentAmount,
        snapshotTotal: snapshot.total,
        driftDetails,
        severity: DriftSeverity.CRITICAL,
      });

      throw new BadRequestException(
        `Discount drift detected: engine total (${engineTotal}) does not match payment intent amount (${paymentIntentAmount}). Difference: ${difference}`,
      );
    }
  }

  /**
   * Detect drift during webhook processing
   * Compares snapshot total vs payment amount from webhook
   */
  async detectWebhookDrift(
    checkoutId: string,
    paymentIntentId: string,
    snapshot: DiscountSnapshot,
    webhookPaymentAmount: number,
  ): Promise<void> {
    const tolerance = 0.01;
    const difference = Math.abs(snapshot.total - webhookPaymentAmount);

    if (difference > tolerance) {
      const driftDetails = {
        reason: "Snapshot total does not match webhook payment amount",
        expected: webhookPaymentAmount,
        actual: snapshot.total,
        mismatchType: "WEBHOOK_PAYMENT_AMOUNT_MISMATCH",
      };

      await this.auditService.logDrift({
        event: AuditEventType.DRIFT_DETECTED,
        checkoutId,
        paymentIntentId,
        snapshotTotal: snapshot.total,
        paymentAmount: webhookPaymentAmount,
        driftDetails,
        severity: DriftSeverity.CRITICAL,
      });

      throw new BadRequestException(
        `Discount drift detected: snapshot total (${snapshot.total}) does not match webhook payment amount (${webhookPaymentAmount})`,
      );
    }
  }

  /**
   * Detect drift during order creation
   * Checks rule hash, engine version, discount IDs
   */
  async detectOrderCreationDrift(
    checkoutId: string,
    orderId: string,
    snapshot: DiscountSnapshot,
    currentRules: DiscountResponseDto[],
  ): Promise<{
    hasDrift: boolean;
    severity: DriftSeverity;
    // biome-ignore lint/suspicious/noExplicitAny: Flexible drift details structure
    details: any;
  }> {
    // biome-ignore lint/suspicious/noExplicitAny: Flexible issue structure
    const issues: any[] = [];
    let severity = DriftSeverity.INFO;

    // Check engine version
    if (snapshot.engineVersion !== DISCOUNT_ENGINE_VERSION) {
      issues.push({
        type: "ENGINE_VERSION_MISMATCH",
        expected: DISCOUNT_ENGINE_VERSION,
        actual: snapshot.engineVersion,
      });
      severity = DriftSeverity.WARNING;
    }

    // Check rule hash (warn but don't block - rules may have changed after snapshot)
    const currentHash = computeRuleHash(currentRules);
    if (snapshot.ruleHash !== currentHash) {
      issues.push({
        type: "RULE_HASH_MISMATCH",
        expected: currentHash,
        actual: snapshot.ruleHash,
        reason: "Discount rules changed after snapshot creation",
      });
      severity = DriftSeverity.WARNING;
    }

    // Check if discount IDs still exist
    const currentDiscountIds = new Set(currentRules.map((r) => r.id));
    const missingDiscountIds = snapshot.appliedDiscountIds.filter(
      (id) => !currentDiscountIds.has(id),
    );

    if (missingDiscountIds.length > 0) {
      issues.push({
        type: "MISSING_DISCOUNT_IDS",
        missingIds: missingDiscountIds,
        reason: "Discounts were deleted after snapshot creation",
      });
      severity = DriftSeverity.WARNING;
    }

    if (issues.length > 0) {
      const driftDetails = {
        reason: "Order creation drift detected",
        expected: "No drift expected",
        actual: issues,
        mismatchType: "ORDER_CREATION_DRIFT",
      };

      await this.auditService.logDrift({
        event: AuditEventType.DRIFT_DETECTED,
        checkoutId,
        orderId,
        snapshotVersion: snapshot.computedAt,
        ruleHash: snapshot.ruleHash,
        engineVersion: snapshot.engineVersion,
        snapshotTotal: snapshot.total,
        appliedDiscountIds: snapshot.appliedDiscountIds,
        driftDetails,
        severity,
      });

      return {
        hasDrift: true,
        severity,
        details: driftDetails,
      };
    }

    return {
      hasDrift: false,
      severity: DriftSeverity.INFO,
      details: null,
    };
  }
}
