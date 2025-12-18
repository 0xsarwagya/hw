# Discount Snapshots

## Overview

Discount snapshots are immutable records of discount calculations created at payment intent creation. They ensure that discounts remain consistent throughout checkout, even if discount rules change.

## Snapshot Structure

```typescript
interface DiscountSnapshot extends DiscountEngineResult {
  engineVersion: string; // e.g., "discount-engine-v1"
  rulesetVersion: number; // Increments on discount rule changes
  computedAt: string; // ISO timestamp
  ruleHash: string; // SHA-256 hash of discount rules
  bundleBreakdowns?: BundleDiscountBreakdown[]; // Bundle discount details
}
```

## Snapshot Creation

```typescript
const discountResult = await discountEngine.run({
  cart: cartItems,
  discounts: eligibleDiscounts,
  customer: customer
});

const snapshot = createDiscountSnapshot(
  discountResult,
  appliedDiscounts,
  rulesetVersion,
  bundleBreakdowns
);
```

## Snapshot Fields

- **engineVersion**: Discount engine version used
- **rulesetVersion**: Ruleset version (increments on rule changes)
- **computedAt**: ISO timestamp of creation
- **ruleHash**: SHA-256 hash of discount rules
- **bundleBreakdowns**: Bundle discount breakdowns

## Snapshot Validation

Validated at payment intent creation, order creation, and webhook processing to ensure consistency.

