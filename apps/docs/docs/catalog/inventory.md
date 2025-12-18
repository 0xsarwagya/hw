# Inventory Management

The inventory system provides real-time stock tracking, reservation management, and automatic reconciliation for product variants. It ensures accurate stock levels across high-concurrency operations and prevents overselling.

## Inventory Architecture

### Dual Storage Strategy
- **Database**: Authoritative source for initial inventory levels
- **Redis**: High-performance cache for real-time operations
- **Synchronization**: Database updates propagate to Redis cache

### Key Components
- **Inventory Store**: Redis-based inventory operations
- **Inventory Recovery**: Background reconciliation service
- **Inventory Metrics**: Monitoring and analytics

## Redis Key Patterns

```typescript
// Available inventory per variant
inventory:variant:{variantId} → quantity

// Reserved inventory per variant
inventory:reserved:{variantId} → quantity

// Individual reservations (with TTL)
inventory:reservation:{cartId}:{variantId} → quantity
```

## Reservation Lifecycle

### 1. Cart Addition
```typescript
// Reserve inventory when adding to cart
await inventoryStore.reserveInventory(cartId, variantId, quantity, ttl);
```

### 2. Reservation Management
- **TTL**: Reservations expire after configurable time (default: 30 minutes)
- **Extension**: TTL refreshed on cart updates
- **Cleanup**: Expired reservations automatically release inventory

### 3. Order Completion
```typescript
// Convert reservation to consumed inventory
await inventoryStore.commitReservation(variantId, quantity);
```

### 4. Cart Abandonment
```typescript
// Release reservation back to available inventory
await inventoryStore.releaseInventory(variantId, quantity);
```

## Atomic Operations

### Reservation Script (Lua)
```lua
-- Reserve inventory atomically
local available = redis.call('GET', inventory_key)
local reserved = redis.call('GET', reserved_key) or 0

if not available or tonumber(available) < quantity + tonumber(reserved) then
    return {'err', 'INSUFFICIENT_INVENTORY', available}
end

redis.call('INCRBY', reserved_key, quantity)
redis.call('SETEX', reservation_key, ttl, quantity)

return {'ok'}
```

### Benefits
- **Race Condition Prevention**: Single-threaded Lua execution
- **Consistency**: All-or-nothing operations
- **Performance**: Minimal Redis round trips

## Inventory Reconciliation

### Automatic Recovery
Runs on application startup and periodically (every 7 minutes) to:

1. **Detect Expired Reservations**
   - Find reservations without TTL
   - Release orphaned inventory

2. **Fix Inconsistencies**
   - Compare aggregated vs individual reservations
   - Correct mismatched counts

3. **Handle Edge Cases**
   - Negative inventory corrections
   - Impossible states (reserved > total)

### Reconciliation Process
```typescript
async reconcileReservations(): Promise<ReconciliationResult> {
  // 1. Scan for active reservations
  // 2. Check for orphaned reservations (no TTL)
  // 3. Compare aggregated vs individual counts
  // 4. Fix negative/invalid states
  // 5. Release expired reservations
  // 6. Update metrics
}
```

## Inventory Metrics

### Real-time Analytics
```typescript
interface InventoryMetrics {
  totalAvailable: number;        // Sum of all variant inventory
  totalReserved: number;         // Sum of all reserved inventory
  activeReservations: number;    // Current active reservations
  expiredReservations: number;   // Recently expired reservations
}
```

### Monitoring Dashboard
- **Stock Levels**: Per-variant availability
- **Reservation Rates**: Active vs expired reservations
- **Recovery Operations**: Reconciliation success/failure rates
- **Performance Metrics**: Operation latency and throughput

## API Endpoints

### Get Inventory Metrics
```http
GET /admin/inventory/metrics
```

Response:
```json
{
  "totalAvailable": 1250,
  "totalReserved": 45,
  "activeReservations": 23,
  "expiredReservations": 2,
  "variantsCount": 89
}
```

### Manual Reconciliation
```http
POST /admin/inventory/reconcile
```

Response:
```json
{
  "released": 12,
  "inconsistencies": 3,
  "orphaned": 5,
  "negativeCorrections": 0,
  "variantsProcessed": 89,
  "durationMs": 245
}
```

## Business Logic

### Inventory Constraints
- **Non-negative**: Inventory cannot be negative
- **Atomic Updates**: All operations are atomic
- **Reservation Limits**: Cannot reserve more than available

### Order Processing
1. **Pre-check**: Verify inventory availability
2. **Reserve**: Hold inventory during checkout
3. **Commit**: Consume inventory on payment success
4. **Rollback**: Release reservation on payment failure

### Concurrency Handling
- **Optimistic Locking**: Version-based conflict resolution
- **Deadlock Prevention**: Consistent key ordering
- **Timeout Handling**: Automatic cleanup of stale operations

## Performance Optimization

### Redis Configuration
```typescript
// Optimized for inventory operations
{
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  lazyConnect: false,
}
```

### Caching Strategy
- **Hot Variants**: Frequently accessed inventory cached in memory
- **Batch Operations**: Bulk inventory updates
- **Connection Pooling**: Efficient Redis connection management

### Monitoring
- **Operation Latency**: Track Redis command performance
- **Error Rates**: Monitor failed inventory operations
- **Cache Hit Rates**: Optimize frequently accessed data

## Error Handling

### Reservation Failures
```typescript
// Insufficient inventory
throw new BadRequestException(
  `Insufficient inventory. Available: ${available}`
);

// Script execution errors
throw new Error(`Reservation failed: ${error.message}`);
```

### Recovery Scenarios
- **Redis Connection Loss**: Graceful degradation with database fallback
- **Script Failures**: Transaction rollback and error logging
- **Data Inconsistencies**: Automatic reconciliation and correction

## Integration Points

### Cart System
- Real-time inventory validation
- Reservation management during cart operations
- Automatic cleanup on cart abandonment

### Order Processing
- Inventory commitment on successful payment
- Reservation rollback on payment failure
- Order cancellation inventory restoration

### Product Management
- Variant inventory updates
- Bulk inventory operations
- Inventory synchronization with external systems

### Analytics
- Stock level reporting
- Reservation pattern analysis
- Out-of-stock prediction

## Scalability Considerations

### Horizontal Scaling
- **Redis Cluster**: Distributed inventory storage
- **Sharding**: Variant-based data distribution
- **Replication**: Read replicas for metrics

### Performance Limits
- **Throughput**: 10,000+ operations/second
- **Latency**: Sub-millisecond inventory checks
- **Consistency**: Strong consistency for critical operations

### Monitoring & Alerting
- **Low Stock Alerts**: Configurable thresholds
- **Reservation Spikes**: Unusual reservation patterns
- **Reconciliation Failures**: Recovery process monitoring

## Best Practices

### Inventory Management
1. **Regular Reconciliation**: Run periodic consistency checks
2. **Monitor Metrics**: Track inventory health indicators
3. **Handle Edge Cases**: Account for system failures and data corruption

### Performance
1. **Cache Warming**: Pre-load frequently accessed inventory
2. **Batch Operations**: Group related inventory updates
3. **Connection Pooling**: Maintain persistent Redis connections

### Reliability
1. **Graceful Degradation**: Continue operations during Redis outages
2. **Data Backup**: Regular inventory state snapshots
3. **Audit Logging**: Track all inventory changes for compliance
