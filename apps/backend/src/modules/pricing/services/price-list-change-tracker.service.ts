import { Injectable } from "@nestjs/common";
import {
  PricingAuditEventType,
  PricingDriftSeverity,
} from "../audit/pricing-audit.types";
import { PriceListResponseDto } from "../dto/price-list-response.dto";
import { PriceList } from "../engine/pricing-engine.types";
import { computePriceListHash } from "../engine/pricing-hash.utils";
import { PricingAuditService } from "./pricing-audit.service";

@Injectable()
export class PriceListChangeTracker {
  constructor(private readonly auditService: PricingAuditService) {}

  /**
   * Track price list creation
   */
  async trackPriceListCreated(priceList: PriceListResponseDto): Promise<void> {
    // Convert to PriceList format for hashing
    const priceListForHash: PriceList = {
      id: priceList.id,
      name: priceList.name,
      type: priceList.type,
      priority: priceList.priority,
      isActive: priceList.isActive,
      startDate: priceList.startDate || undefined,
      endDate: priceList.endDate || undefined,
      items: priceList.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId || undefined,
        productId: item.productId || undefined,
        categoryId: item.categoryId || undefined,
        overrideType: item.overrideType as "FIXED" | "PERCENTAGE",
        overrideValue: item.overrideValue,
      })),
    };

    await this.auditService.logEvent({
      event: PricingAuditEventType.PRICE_LIST_CHANGE,
      priceListId: priceList.id,
      ruleHash: computePriceListHash([priceListForHash]),
      metadata: {
        action: "CREATED",
        priceListId: priceList.id,
        priceListName: priceList.name,
        changes: {
          new: priceList,
        },
      },
      severity: PricingDriftSeverity.INFO,
    });
  }

  /**
   * Track price list update
   */
  async trackPriceListUpdated(
    oldPriceList: PriceListResponseDto,
    newPriceList: PriceListResponseDto,
  ): Promise<void> {
    const convertToPriceList = (pl: PriceListResponseDto): PriceList => ({
      id: pl.id,
      name: pl.name,
      type: pl.type,
      priority: pl.priority,
      isActive: pl.isActive,
      startDate: pl.startDate || undefined,
      endDate: pl.endDate || undefined,
      items: pl.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId || undefined,
        productId: item.productId || undefined,
        categoryId: item.categoryId || undefined,
        overrideType: item.overrideType as "FIXED" | "PERCENTAGE",
        overrideValue: item.overrideValue,
      })),
    });

    const oldHash = computePriceListHash([convertToPriceList(oldPriceList)]);
    const newHash = computePriceListHash([convertToPriceList(newPriceList)]);

    await this.auditService.logEvent({
      event: PricingAuditEventType.PRICE_LIST_CHANGE,
      priceListId: newPriceList.id,
      ruleHash: newHash,
      metadata: {
        action: "UPDATED",
        priceListId: newPriceList.id,
        priceListName: newPriceList.name,
        oldRuleHash: oldHash,
        newRuleHash: newHash,
        changes: {
          old: oldPriceList,
          new: newPriceList,
          diff: this.computeDiff(oldPriceList, newPriceList),
        },
      },
      severity: PricingDriftSeverity.INFO,
    });
  }

  /**
   * Track price list deletion
   */
  async trackPriceListDeleted(priceList: PriceListResponseDto): Promise<void> {
    const priceListForHash: PriceList = {
      id: priceList.id,
      name: priceList.name,
      type: priceList.type,
      priority: priceList.priority,
      isActive: priceList.isActive,
      startDate: priceList.startDate || undefined,
      endDate: priceList.endDate || undefined,
      items: priceList.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId || undefined,
        productId: item.productId || undefined,
        categoryId: item.categoryId || undefined,
        overrideType: item.overrideType as "FIXED" | "PERCENTAGE",
        overrideValue: item.overrideValue,
      })),
    };

    await this.auditService.logEvent({
      event: PricingAuditEventType.PRICE_LIST_CHANGE,
      priceListId: priceList.id,
      ruleHash: computePriceListHash([priceListForHash]),
      metadata: {
        action: "DELETED",
        priceListId: priceList.id,
        priceListName: priceList.name,
        changes: {
          deleted: priceList,
        },
      },
      severity: PricingDriftSeverity.WARNING, // Deletion is more significant
    });
  }

  /**
   * Compute diff between old and new price list
   */
  private computeDiff(
    old: PriceListResponseDto,
    newPriceList: PriceListResponseDto,
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const keys: (keyof PriceListResponseDto)[] = [
      "name",
      "description",
      "type",
      "priority",
      "isActive",
      "startDate",
      "endDate",
    ];

    for (const key of keys) {
      if (old[key] !== newPriceList[key]) {
        diff[key] = {
          old: old[key],
          new: newPriceList[key],
        };
      }
    }

    // Compare items
    if (old.items.length !== newPriceList.items.length) {
      diff.items = {
        old: old.items.length,
        new: newPriceList.items.length,
      };
    }

    return diff;
  }
}
