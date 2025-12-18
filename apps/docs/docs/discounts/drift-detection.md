# Discount Drift Detection

## Overview

Discount drift detection monitors discrepancies between expected and actual discount amounts throughout checkout.

## Detection Points

1. **Payment Intent Creation**: Compares engine total vs payment intent amount
2. **Webhook Processing**: Compares snapshot total vs webhook payment amount
3. **Order Creation**: Validates rule hash and engine version

## Drift Severity

- **CRITICAL**: Blocks checkout (payment amount mismatch)
- **WARNING**: Logs drift but allows operation (rule changes)

## Drift Report

```http
GET /admin/discounts/drift-report?severity=CRITICAL
```

Returns drift events with filtering by date, severity, and discount ID.

