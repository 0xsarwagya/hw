# Inventory Admin API Testing Guide

This document provides a comprehensive guide for testing the Inventory Admin API endpoints.

## Prerequisites

1. **Database Migration**: Run the migration first
   ```bash
   cd packages/db
   pnpm db:migrate
   ```

2. **Redis**: Ensure Redis is running and accessible

3. **Admin JWT Token**: Obtain an admin JWT token for authentication

## Test Environment Setup

### 1. Get Admin Token

```bash
# Login as admin to get JWT token
curl -X POST http://localhost:3000/api/v1/admin-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

Save the `accessToken` from the response.

### 2. Set Environment Variables

```bash
export ADMIN_TOKEN="your-jwt-token-here"
export BASE_URL="http://localhost:3000/api/v1"
```

## Endpoint Testing

### 1. List Inventory

```bash
# Basic list
curl -X GET "${BASE_URL}/admin/inventory" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# With filters
curl -X GET "${BASE_URL}/admin/inventory?search=TSHIRT&status=active&lowStock=true&page=1&limit=10" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Sort by inventory
curl -X GET "${BASE_URL}/admin/inventory?sortBy=inventory&sortOrder=desc" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Paginated list of inventory items with Redis-enriched data

**Test Cases**:
- ✅ Pagination works correctly
- ✅ Search filters by SKU and product title
- ✅ Status filter works
- ✅ Low stock filter works
- ✅ Out of stock filter works
- ✅ Category filter works
- ✅ Sorting by inventory, committed, updatedAt works
- ✅ Redis data is correctly merged with DB data

### 2. Get Single Variant Inventory

```bash
curl -X GET "${BASE_URL}/admin/inventory/{variantId}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Detailed inventory information including Redis data

**Test Cases**:
- ✅ Returns 404 for non-existent variant
- ✅ Includes inventory, committed, available counts
- ✅ Includes low stock threshold
- ✅ Includes last adjustment info if available
- ✅ Redis data is correctly merged

### 3. Adjust Inventory (Single)

```bash
# Increase inventory
curl -X POST "${BASE_URL}/admin/inventory/{variantId}/adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "increase",
    "quantity": 10,
    "reason": "received",
    "note": "New stock received"
  }'

# Decrease inventory
curl -X POST "${BASE_URL}/admin/inventory/{variantId}/adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "decrease",
    "quantity": 5,
    "reason": "damaged",
    "note": "Damaged items removed"
  }'

# Set inventory
curl -X POST "${BASE_URL}/admin/inventory/{variantId}/adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "set",
    "quantity": 100,
    "reason": "correction",
    "note": "Inventory correction"
  }'
```

**Expected Response**: Adjustment record with old/new quantities

**Test Cases**:
- ✅ Increase adds to current inventory
- ✅ Decrease subtracts from current inventory
- ✅ Set replaces current inventory
- ✅ Prevents negative inventory
- ✅ Creates audit log entry
- ✅ Updates Redis atomically
- ✅ Updates DB variant inventory
- ✅ Invalidates logs cache
- ✅ Returns 400 for invalid adjustment type
- ✅ Returns 400 for negative quantity
- ✅ Returns 404 for non-existent variant

**Verify Redis Sync**:
```bash
# Check Redis key
redis-cli GET "inventory:variant:{variantId}"
```

**Verify DB Update**:
```sql
SELECT inventory, updated_at FROM product_variants WHERE id = '{variantId}';
```

**Verify Audit Log**:
```sql
SELECT * FROM inventory_adjustments WHERE variant_id = '{variantId}' ORDER BY created_at DESC LIMIT 1;
```

### 4. Bulk Adjust Inventory

```bash
curl -X POST "${BASE_URL}/admin/inventory/bulk-adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustments": [
      {
        "sku": "TSHIRT-BLACK-M",
        "type": "increase",
        "quantity": 10,
        "reason": "received",
        "note": "Incoming stock"
      },
      {
        "sku": "TSHIRT-BLACK-L",
        "type": "set",
        "quantity": 120,
        "reason": "correction"
      }
    ]
  }'
```

**Expected Response**: Results array with success/failure for each SKU

**Test Cases**:
- ✅ Processes multiple adjustments
- ✅ Returns success/failure per SKU
- ✅ Handles invalid SKUs gracefully
- ✅ Continues processing even if one fails
- ✅ Creates audit logs for successful adjustments
- ✅ Updates Redis for successful adjustments

### 5. Get Inventory Logs

```bash
# Basic logs
curl -X GET "${BASE_URL}/admin/inventory/{variantId}/logs" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# With filters
curl -X GET "${BASE_URL}/admin/inventory/{variantId}/logs?startDate=2025-01-01&reason=received&type=increase&page=1&limit=20" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Paginated audit logs

**Test Cases**:
- ✅ Returns paginated logs
- ✅ Filters by date range
- ✅ Filters by actor (admin ID)
- ✅ Filters by reason
- ✅ Filters by type
- ✅ Filters by orderId (from metadata)
- ✅ Filters by refundId (from metadata)
- ✅ Cache is used for repeated queries
- ✅ Cache is invalidated after adjustments

**Verify Cache**:
```bash
# Check cache key
redis-cli GET "inv:logs:{variantId}:{query}"
```

### 6. Get Variant Reservations

```bash
curl -X GET "${BASE_URL}/admin/inventory/{variantId}/reservations" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Real-time reservation data from Redis

**Test Cases**:
- ✅ Returns reserved count
- ✅ Returns active reservations with cart IDs
- ✅ Returns expiration times
- ✅ Counts expired reservations
- ✅ Never touches database (pure Redis)

**Verify Redis Data**:
```bash
# Check reserved count
redis-cli GET "inventory:reserved:{variantId}"

# Check individual reservations
redis-cli KEYS "inventory:reservation:*:{variantId}"
```

### 7. Get Reservations Summary

```bash
curl -X GET "${BASE_URL}/admin/inventory/reservations/summary" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: System-wide reservations overview

**Test Cases**:
- ✅ Returns total committed inventory
- ✅ Returns variant count with reservations
- ✅ Lists variants with committed inventory
- ✅ Pure Redis operation (no DB)

### 8. Get Inventory Health

```bash
curl -X GET "${BASE_URL}/admin/inventory/health" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Health dashboard metrics

**Test Cases**:
- ✅ Returns total stock
- ✅ Returns available stock
- ✅ Returns committed stock
- ✅ Returns low stock count
- ✅ Returns out of stock count
- ✅ Returns fastest moving SKUs (top 10)
- ✅ Returns slowest moving SKUs (bottom 10)
- ✅ Aggregates from Redis for real-time counts
- ✅ Aggregates from DB for historical movement

### 9. Get Inventory Settings

```bash
curl -X GET "${BASE_URL}/admin/inventory/settings" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Current settings

**Test Cases**:
- ✅ Returns global threshold
- ✅ Returns per-variant overrides
- ✅ Creates default settings if none exist
- ✅ Uses cache for repeated requests

**Verify Cache**:
```bash
redis-cli GET "inv:settings"
```

### 10. Update Inventory Settings

```bash
curl -X POST "${BASE_URL}/admin/inventory/settings" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "globalLowStockThreshold": 10,
    "perVariantOverrides": {
      "variant-id-1": 5,
      "variant-id-2": 20
    }
  }'
```

**Expected Response**: Updated settings

**Test Cases**:
- ✅ Updates global threshold
- ✅ Updates per-variant overrides
- ✅ Creates settings if none exist
- ✅ Updates cache
- ✅ Invalidates old cache
- ✅ Stores updatedBy admin ID

**Verify DB**:
```sql
SELECT * FROM inventory_settings;
```

**Verify Cache**:
```bash
redis-cli GET "inv:settings"
```

### 11. Get Variants Index

```bash
curl -X GET "${BASE_URL}/admin/inventory/variants/index" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response**: Quick SKU/variant map

**Test Cases**:
- ✅ Returns all variants with basic info
- ✅ Includes SKU, product title, attributes
- ✅ Lightweight query (no joins)
- ✅ Useful for dropdowns

## Authentication & Authorization Testing

### Test Unauthorized Access

```bash
# Without token
curl -X GET "${BASE_URL}/admin/inventory"

# With invalid token
curl -X GET "${BASE_URL}/admin/inventory" \
  -H "Authorization: Bearer invalid-token"

# With customer token (should fail)
curl -X GET "${BASE_URL}/admin/inventory" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}"
```

**Expected**: 401 Unauthorized or 403 Forbidden

### Test Rate Limiting

```bash
# Rapid requests to test rate limiting
for i in {1..1001}; do
  curl -X GET "${BASE_URL}/admin/inventory" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" &
done
wait
```

**Expected**: 429 Too Many Requests after limit exceeded

## Integration Testing Scenarios

### Scenario 1: Complete Adjustment Flow

1. Get current inventory for a variant
2. Adjust inventory (increase)
3. Verify Redis is updated
4. Verify DB is updated
5. Verify audit log is created
6. Get logs and verify new entry appears
7. Verify cache is invalidated

### Scenario 2: Bulk Operations

1. Create multiple adjustments via bulk endpoint
2. Verify all successful adjustments are logged
3. Verify Redis is updated for all variants
4. Verify failed adjustments are reported

### Scenario 3: Low Stock Detection

1. Set low stock threshold
2. Adjust inventory to below threshold
3. Query inventory list with lowStock filter
4. Verify variant appears in results

### Scenario 4: Reservation Visibility

1. Create a cart with items (creates reservations)
2. Get variant reservations
3. Verify active reservations are visible
4. Wait for TTL expiration
5. Verify expired reservations are counted

## Performance Testing

### Redis-First Reads

```bash
# Time the request (should be < 10ms for Redis hits)
time curl -X GET "${BASE_URL}/admin/inventory/{variantId}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

### Cache Effectiveness

```bash
# First request (cache miss)
time curl -X GET "${BASE_URL}/admin/inventory/{variantId}/logs" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Second request (cache hit - should be faster)
time curl -X GET "${BASE_URL}/admin/inventory/{variantId}/logs" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

## Error Handling Testing

### Invalid Inputs

```bash
# Invalid adjustment type
curl -X POST "${BASE_URL}/admin/inventory/{variantId}/adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invalid",
    "quantity": 10,
    "reason": "received"
  }'

# Negative quantity
curl -X POST "${BASE_URL}/admin/inventory/{variantId}/adjust" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "increase",
    "quantity": -5,
    "reason": "received"
  }'

# Invalid UUID
curl -X GET "${BASE_URL}/admin/inventory/invalid-uuid" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected**: 400 Bad Request with validation errors

## Database Transaction Testing

### Atomic Operations

1. Start a transaction manually
2. Make an adjustment
3. Simulate Redis failure
4. Verify transaction rollback
5. Verify no partial updates

## Redis Sync Testing

### Verify Consistency

```bash
# After adjustment, verify Redis and DB match
VARIANT_ID="your-variant-id"

# Get from Redis
REDIS_VALUE=$(redis-cli GET "inventory:variant:${VARIANT_ID}")

# Get from DB
DB_VALUE=$(psql -d your_db -t -c "SELECT inventory FROM product_variants WHERE id = '${VARIANT_ID}'")

# Compare
echo "Redis: ${REDIS_VALUE}"
echo "DB: ${DB_VALUE}"
```

## Test Checklist

- [ ] All endpoints return correct status codes
- [ ] Authentication works (401 without token)
- [ ] Authorization works (403 for non-admin)
- [ ] Rate limiting works (429 after limit)
- [ ] Data validation works (400 for invalid input)
- [ ] Redis sync works (Redis and DB match)
- [ ] DB transactions are atomic
- [ ] Audit logs are created correctly
- [ ] Cache invalidation works
- [ ] Pagination works correctly
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Error handling is proper
- [ ] Performance is acceptable (< 100ms for most endpoints)

## Automated Testing

For automated testing, consider using:

- **Jest** for unit tests
- **Supertest** for API integration tests
- **Redis mock** for Redis operations
- **Test database** for DB operations

Example test structure:

```typescript
describe('AdminInventoryController', () => {
  describe('GET /admin/inventory', () => {
    it('should return paginated inventory list', async () => {
      // Test implementation
    });
  });

  describe('POST /admin/inventory/:variantId/adjust', () => {
    it('should adjust inventory atomically', async () => {
      // Test implementation
    });
  });
});
```

