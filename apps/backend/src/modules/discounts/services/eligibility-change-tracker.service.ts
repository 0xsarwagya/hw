import { Injectable } from "@nestjs/common";
import { AuditEventType, DriftSeverity } from "../audit/discount-audit.types";
import { DiscountAuditService } from "./discount-audit.service";

@Injectable()
export class EligibilityChangeTracker {
  constructor(private readonly auditService: DiscountAuditService) {}

  /**
   * Track eligibility drift between Redis cache and DB
   */
  async trackEligibilityDrift(
    discountId: string,
    variantId: string,
    redisEligibility: boolean,
    dbEligibility: boolean,
  ): Promise<void> {
    if (redisEligibility !== dbEligibility) {
      await this.auditService.logEvent({
        event: AuditEventType.DISCOUNT_ELIGIBILITY_CHANGE,
        metadata: {
          discountId,
          variantId,
          redisEligibility,
          dbEligibility,
          driftType: "CACHE_DB_MISMATCH",
        },
        severity:
          redisEligibility && !dbEligibility
            ? DriftSeverity.CRITICAL // Cache says eligible but DB says not - could cause wrong discounts
            : DriftSeverity.WARNING, // Cache says not eligible but DB says eligible - just stale cache
      });
    }
  }
}
