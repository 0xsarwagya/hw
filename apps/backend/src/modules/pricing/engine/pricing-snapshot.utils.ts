import { PRICING_ENGINE_VERSION } from "./pricing-engine.constants";
import {
  BundlePricingBreakdown,
  PriceList,
  PricingEngineResult,
  PricingSnapshot,
} from "./pricing-engine.types";
import { computePriceListHash } from "./pricing-hash.utils";

/**
 * Generate pricing snapshot from engine result
 * Adds versioning and integrity metadata to freeze pricing at payment intent creation
 */
export function createPricingSnapshot(
  engineResult: PricingEngineResult,
  appliedPriceLists: PriceList[],
  rulesetVersion: number,
  bundleBreakdowns?: BundlePricingBreakdown[],
): PricingSnapshot {
  return {
    ...engineResult,
    engineVersion: PRICING_ENGINE_VERSION,
    rulesetVersion,
    computedAt: new Date().toISOString(),
    ruleHash: computePriceListHash(appliedPriceLists),
    bundleBreakdowns,
  };
}
