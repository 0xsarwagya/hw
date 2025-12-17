import { BadRequestException, Injectable } from "@nestjs/common";
import {
  PricingAuditEventType,
  PricingDriftSeverity,
} from "../audit/pricing-audit.types";
import { PRICING_ENGINE_VERSION } from "../engine/pricing-engine.constants";
import { PriceList, PricingSnapshot } from "../engine/pricing-engine.types";
import { computePriceListHash } from "../engine/pricing-hash.utils";
import { PricingAuditService } from "./pricing-audit.service";

@Injectable()
export class PricingDriftDetectorService {
  constructor(private readonly auditService: PricingAuditService) {}

  /**
   * Detect drift during payment intent creation
   * Compares engine output total vs payment intent amount
   */
  async detectPaymentIntentDrift(
    checkoutId: string,
    engineTotal: number,
    paymentIntentAmount: number,
    snapshot: PricingSnapshot,
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
        event: PricingAuditEventType.PRICING_DRIFT_DETECTED,
        checkoutId,
        effectivePrice: engineTotal,
        paymentAmount: paymentIntentAmount,
        snapshotPrice: snapshot.totalEffectivePrice,
        driftDetails,
        severity: PricingDriftSeverity.CRITICAL,
      });

      throw new BadRequestException(
        `Pricing drift detected: engine total (${engineTotal}) does not match payment intent amount (${paymentIntentAmount}). Difference: ${difference}`,
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
    snapshot: PricingSnapshot,
    webhookPaymentAmount: number,
  ): Promise<void> {
    const tolerance = 0.01;
    const difference = Math.abs(
      snapshot.totalEffectivePrice - webhookPaymentAmount,
    );

    if (difference > tolerance) {
      const driftDetails = {
        reason: "Snapshot total does not match webhook payment amount",
        expected: webhookPaymentAmount,
        actual: snapshot.totalEffectivePrice,
        mismatchType: "WEBHOOK_PAYMENT_AMOUNT_MISMATCH",
      };

      await this.auditService.logDrift({
        event: PricingAuditEventType.PRICING_DRIFT_DETECTED,
        checkoutId,
        paymentAmount: webhookPaymentAmount,
        snapshotPrice: snapshot.totalEffectivePrice,
        driftDetails,
        severity: PricingDriftSeverity.CRITICAL,
      });

      throw new BadRequestException(
        `Pricing drift detected: snapshot total (${snapshot.totalEffectivePrice}) does not match webhook payment amount (${webhookPaymentAmount})`,
      );
    }
  }

  /**
   * Detect drift during order creation
   * Checks rule hash, engine version, price list IDs
   */
  async detectOrderCreationDrift(
    checkoutId: string,
    orderId: string,
    snapshot: PricingSnapshot,
    currentPriceLists: PriceList[],
  ): Promise<{
    hasDrift: boolean;
    severity: PricingDriftSeverity;
    // biome-ignore lint/suspicious/noExplicitAny: Flexible structure for drift details
    details: any;
  }> {
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle ORM condition array type
    const issues: any[] = [];
    let severity = PricingDriftSeverity.INFO;

    // Check engine version
    if (snapshot.engineVersion !== PRICING_ENGINE_VERSION) {
      issues.push({
        type: "ENGINE_VERSION_MISMATCH",
        expected: PRICING_ENGINE_VERSION,
        actual: snapshot.engineVersion,
      });
      severity = PricingDriftSeverity.WARNING;
    }

    // Check rule hash (warn but don't block - rules may have changed after snapshot)
    const currentHash = computePriceListHash(currentPriceLists);
    if (snapshot.ruleHash !== currentHash) {
      issues.push({
        type: "RULE_HASH_MISMATCH",
        expected: currentHash,
        actual: snapshot.ruleHash,
        reason: "Price lists changed after snapshot creation",
      });
      severity = PricingDriftSeverity.WARNING;
    }

    // Check if price list IDs still exist
    const currentPriceListIds = new Set(currentPriceLists.map((pl) => pl.id));
    const missingPriceListIds = snapshot.appliedPriceListIds.filter(
      (id) => !currentPriceListIds.has(id),
    );

    if (missingPriceListIds.length > 0) {
      issues.push({
        type: "MISSING_PRICE_LIST_IDS",
        missingIds: missingPriceListIds,
        reason: "Price lists were deleted after snapshot creation",
      });
      severity = PricingDriftSeverity.WARNING;
    }

    if (issues.length > 0) {
      const driftDetails = {
        reason: "Order creation drift detected",
        issues,
        mismatchType: "ORDER_CREATION_DRIFT",
      };

      await this.auditService.logDrift({
        event: PricingAuditEventType.PRICING_DRIFT_DETECTED,
        checkoutId,
        orderId,
        rulesetVersion: snapshot.rulesetVersion.toString(),
        ruleHash: snapshot.ruleHash,
        engineVersion: snapshot.engineVersion,
        snapshotPrice: snapshot.totalEffectivePrice,
        driftDetails: {
          reason: driftDetails.reason,
          expected: driftDetails.issues,
          actual: snapshot,
          mismatchType: driftDetails.mismatchType,
        },
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
      severity: PricingDriftSeverity.INFO,
      details: null,
    };
  }
}
