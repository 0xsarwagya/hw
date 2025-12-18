# Price Lists

## Overview

Price lists allow you to create custom pricing for specific customer groups. They can override base prices at the variant, product, or category level.

## Price List Structure

```typescript
interface PriceList {
  id: string;
  name: string;
  type: "STANDARD" | "SALE" | "CUSTOM";
  priority: number; // Lower = higher priority
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  items: PriceListItem[];
}
```

## Price List Items

Price list items define overrides at different specificity levels:

### Variant-Level Override

Most specific, applies to a single product variant:

```json
{
  "productVariantId": "variant-123",
  "overrideType": "FIXED",
  "overrideValue": 999.99
}
```

### Product-Level Override

Applies to all variants of a product:

```json
{
  "productId": "product-456",
  "overrideType": "PERCENTAGE",
  "overrideValue": 15
}
```

### Category-Level Override

Applies to all products in a category:

```json
{
  "categoryId": "category-789",
  "overrideType": "PERCENTAGE",
  "overrideValue": 10
}
```

## Priority System

When multiple price lists apply to the same customer group:

1. **Priority Number**: Lower number = higher priority
2. **Specificity**: Variant > Product > Category
3. **Active Status**: Only active price lists are considered
4. **Date Range**: Only price lists within start/end dates are considered

## Customer Group Association

Price lists are associated with customer groups:

```typescript
interface CustomerGroup {
  id: string;
  name: string;
  priceLists: Array<{
    priceListId: string;
    priority: number;
  }>;
}
```

A customer group can have multiple price lists, ordered by priority.

## Creating a Price List

### Example: VIP Customer Pricing

```http
POST /admin/pricing/price-lists
Content-Type: application/json

{
  "name": "VIP Customer Pricing",
  "type": "STANDARD",
  "priority": 1,
  "isActive": true,
  "items": [
    {
      "productVariantId": "variant-123",
      "overrideType": "FIXED",
      "overrideValue": 899.99
    },
    {
      "categoryId": "electronics",
      "overrideType": "PERCENTAGE",
      "overrideValue": 15
    }
  ]
}
```

## Price List Resolution

When calculating price for a variant:

1. Get customer's group
2. Load all price lists for that group (ordered by priority)
3. For each price list, check for overrides (variant → product → category)
4. Select most specific override from highest priority price list
5. Apply override to base price

## Override Types

### FIXED Override

Replaces base price with fixed amount:

```typescript
effectivePrice = overrideValue;
```

### PERCENTAGE Override

Applies percentage discount:

```typescript
effectivePrice = basePrice * (1 - overrideValue / 100);
```

## Date-Based Price Lists

Price lists can have start and end dates for time-limited pricing:

```json
{
  "name": "Holiday Sale",
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "isActive": true
}
```

## API Endpoints

- `GET /admin/pricing/price-lists` - List all price lists
- `POST /admin/pricing/price-lists` - Create price list
- `GET /admin/pricing/price-lists/:id` - Get price list
- `PATCH /admin/pricing/price-lists/:id` - Update price list
- `DELETE /admin/pricing/price-lists/:id` - Delete price list
- `POST /admin/pricing/price-lists/:id/items` - Add price list item

## Caching

Price lists are cached in Redis:

- **Cache Key**: `pricing:price-list:{id}`
- **TTL**: 1 hour
- **Invalidation**: On price list create/update/delete

## Best Practices

1. **Use Variant Overrides Sparingly**: Prefer product or category overrides for easier management
2. **Set Clear Priorities**: Use consistent priority numbering (1, 10, 100)
3. **Test Override Conflicts**: Ensure most specific override wins as expected
4. **Monitor Performance**: Large price lists may impact pricing calculation speed
5. **Use Date Ranges**: Set start/end dates for time-limited pricing

## Edge Cases

- **No Override Found**: Uses base price
- **Multiple Overrides**: Most specific wins (variant > product > category)
- **Expired Price List**: Ignored if outside date range
- **Inactive Price List**: Ignored even if within date range
- **Circular Dependencies**: Not possible (price lists don't reference each other)

