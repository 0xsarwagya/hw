import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DISCOUNT_ENGINE_VERSION } from "./discount-engine.constants";
import {
  DiscountEngineResult,
  DiscountSnapshot,
} from "./discount-engine.types";
import { computeRuleHash } from "./discount-hash.utils";

/**
 * Generate discount snapshot from engine result
 * Adds versioning and integrity metadata to freeze pricing at payment intent creation
 */
export function createDiscountSnapshot(
  engineResult: DiscountEngineResult,
  appliedDiscounts: DiscountResponseDto[],
  rulesetVersion: number,
): DiscountSnapshot {
  return {
    ...engineResult,
    engineVersion: DISCOUNT_ENGINE_VERSION,
    computedAt: new Date().toISOString(),
    ruleHash: computeRuleHash(appliedDiscounts),
    rulesetVersion,
  };
}
