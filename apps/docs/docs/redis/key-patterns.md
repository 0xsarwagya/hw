# Redis Key Patterns

## Pattern Structure

All Redis keys follow consistent patterns for easy identification and management.

## Pricing Keys

```
pricing:variant:{variantId}:group:{groupId}
pricing:price-list:{priceListId}
pricing:customer-group:{groupId}
pricing:bundle:{version}
```

## Discount Keys

```
discounts:rules:{hash}
discounts:eligibility:{discountId}:{cartHash}
discounts:bundle:{version}
```

## Bundle Keys

```
bundles:bundle:{bundleId}
bundles:eligibility:{bundleId}:{selectionHash}
```

## Cart Keys

```
cart:{cartId}
cart:items:{cartId}
```

## Checkout Keys

```
checkout:session:{sessionId}
checkout:payment-intent:{paymentIntentId}
```

## Inventory Keys

```
inventory:reservation:{reservationId}
inventory:variant:{variantId}
```

## Admin Keys

```
admin:session:{sessionId}
admin:login:ip:{ipAddress}
admin:activity:{adminId}
```

## Review Keys

```
reviews:aggregation:{productId}
reviews:helpful:{reviewId}
```

## TTL Values

- **5 minutes**: Rate limiting, temporary locks
- **15 minutes**: Checkout sessions
- **1 hour**: Cached calculations, price lists
- **24 hours**: Review aggregations, static data
- **No TTL**: Cart data, admin sessions (managed manually)

## Key Naming Best Practices

1. **Use Colons**: Separate segments with colons
2. **Be Descriptive**: Use clear, descriptive names
3. **Include IDs**: Include relevant IDs in keys
4. **Version When Needed**: Include version for versioned data
5. **Consistent Patterns**: Follow established patterns

