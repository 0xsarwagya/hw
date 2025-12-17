import { Injectable } from "@nestjs/common";
import { AuditEventType, DriftSeverity } from "../audit/discount-audit.types";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { computeRuleHash } from "../engine/discount-hash.utils";
import { DiscountAuditService } from "./discount-audit.service";

@Injectable()
export class RuleChangeTracker {
  constructor(private readonly auditService: DiscountAuditService) {}

  /**
   * Track discount rule creation
   */
  async trackRuleCreated(discount: DiscountResponseDto): Promise<void> {
    await this.auditService.logEvent({
      event: AuditEventType.DISCOUNT_RULE_CHANGE,
      metadata: {
        action: "CREATED",
        discountId: discount.id,
        discountCode: discount.code,
        ruleHash: computeRuleHash([discount]),
        changes: {
          new: discount,
        },
      },
      severity: DriftSeverity.INFO,
    });
  }

  /**
   * Track discount rule update
   */
  async trackRuleUpdated(
    oldDiscount: DiscountResponseDto,
    newDiscount: DiscountResponseDto,
  ): Promise<void> {
    const oldHash = computeRuleHash([oldDiscount]);
    const newHash = computeRuleHash([newDiscount]);

    await this.auditService.logEvent({
      event: AuditEventType.DISCOUNT_RULE_CHANGE,
      metadata: {
        action: "UPDATED",
        discountId: newDiscount.id,
        discountCode: newDiscount.code,
        oldRuleHash: oldHash,
        newRuleHash: newHash,
        changes: {
          old: oldDiscount,
          new: newDiscount,
          diff: this.computeDiff(oldDiscount, newDiscount),
        },
      },
      severity: DriftSeverity.INFO,
    });
  }

  /**
   * Track discount rule deletion
   */
  async trackRuleDeleted(discount: DiscountResponseDto): Promise<void> {
    await this.auditService.logEvent({
      event: AuditEventType.DISCOUNT_RULE_CHANGE,
      metadata: {
        action: "DELETED",
        discountId: discount.id,
        discountCode: discount.code,
        ruleHash: computeRuleHash([discount]),
        changes: {
          deleted: discount,
        },
      },
      severity: DriftSeverity.WARNING, // Deletion is more significant
    });
  }

  /**
   * Compute diff between old and new discount
   */
  private computeDiff(
    old: DiscountResponseDto,
    newDiscount: DiscountResponseDto,
    // biome-ignore lint/suspicious/noExplicitAny: Flexible diff structure for audit logs
  ): Record<string, { old: any; new: any }> {
    // biome-ignore lint/suspicious/noExplicitAny: Flexible diff structure for audit logs
    const diff: Record<string, { old: any; new: any }> = {};
    const keys = Object.keys(newDiscount) as (keyof DiscountResponseDto)[];

    for (const key of keys) {
      if (old[key] !== newDiscount[key]) {
        diff[key] = {
          old: old[key],
          new: newDiscount[key],
        };
      }
    }

    return diff;
  }
}
