# Redis Architecture

## Overview

Redis is used extensively in VCEcom for caching, session storage, and temporary data. All Redis operations go through the centralized `RedisStoreService`.

## Key Patterns

### Caching

- **Pricing**: Price calculations cached with customer group + variant ID
- **Discounts**: Discount rules cached with rule hash
- **Bundles**: Bundle definitions cached with bundle ID
- **Reviews**: Review aggregations cached with product ID

### Session Storage

- **Cart**: Shopping cart data
- **Checkout**: Checkout session state
- **Admin Sessions**: Admin authentication sessions

### Temporary Storage

- **Inventory Reservations**: Temporary inventory holds
- **Idempotency Keys**: Prevent duplicate operations
- **Rate Limiting**: Login attempt tracking

## Key Patterns

All Redis keys follow consistent patterns:

- `pricing:variant:{variantId}:group:{groupId}`
- `discounts:rules:{hash}`
- `bundles:bundle:{bundleId}`
- `cart:{cartId}`
- `checkout:session:{sessionId}`

## TTL Management

- **Short TTL** (5-15 min): Frequently changing data
- **Medium TTL** (1 hour): Cached calculations
- **Long TTL** (24 hours): Static data
- **No TTL**: Session data (managed manually)

## Lua Scripts

Atomic operations use Lua scripts:

- **Inventory Reservation**: Atomic reserve/release
- **Cart Updates**: Atomic add/remove items
- **Rate Limiting**: Atomic increment with expiry

## Best Practices

1. **Consistent Key Patterns**: Use consistent naming
2. **Appropriate TTLs**: Set TTLs based on data volatility
3. **Atomic Operations**: Use Lua scripts for atomicity
4. **Monitor Memory**: Monitor Redis memory usage
5. **Handle Failures**: Gracefully handle Redis failures

