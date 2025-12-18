# Redis Architecture

Redis serves as the high-performance data layer for real-time operations, caching, session management, and distributed coordination. The architecture implements multiple Redis usage patterns optimized for different operational requirements.

## Redis Architecture Overview

### Multi-Layer Caching Strategy

```
┌─────────────────┐
│   Application   │
├─────────────────┤
│  Redis Layer    │
│  ┌─────────────┐ │
│  │ Operational │ │ ← Real-time operations (inventory, checkout)
│  │   Cache     │ │
│  ├─────────────┤ │
│  │ Application │ │ ← Business data (products, discounts, bundles)
│  │   Cache     │ │
│  ├─────────────┤ │
│  │   Session   │ │ ← User sessions, carts, checkout state
│  │   Store     │ │
│  └─────────────┘ │
├─────────────────┤
│   PostgreSQL    │ ← Authoritative data source
└─────────────────┘
```

### Redis Usage Patterns

#### 1. Operational Cache
- **Purpose**: Real-time operational data with strict consistency requirements
- **TTL**: Varies by operation (seconds to hours)
- **Examples**: Inventory levels, checkout sessions, payment intents
- **Consistency**: Strong consistency with atomic operations

#### 2. Application Cache
- **Purpose**: Performance optimization for frequently accessed business data
- **TTL**: Hours to days
- **Examples**: Product details, discount rules, bundle definitions
- **Consistency**: Eventual consistency with background refresh

#### 3. Session Store
- **Purpose**: User session management and temporary state
- **TTL**: Days to weeks
- **Examples**: Shopping carts, user preferences, temporary locks
- **Consistency**: Session-scoped consistency

## Key Architecture Patterns

### Atomic Operations with Lua Scripts

Redis Lua scripts ensure atomicity for complex multi-key operations:

```lua
-- Example: Atomic inventory reservation
local available = redis.call('GET', inventory_key)
local reserved = redis.call('GET', reserved_key) or 0

if not available or tonumber(available) < quantity + tonumber(reserved) then
    return {'err', 'INSUFFICIENT_INVENTORY', available}
end

redis.call('INCRBY', reserved_key, quantity)
redis.call('SETEX', reservation_key, ttl, quantity)

return {'ok'}
```

### Key Naming Conventions

All Redis keys follow structured naming patterns:

```
{store}:{type}:{identifier}:{sub-identifier}
```

**Examples:**
- `inventory:variant:123` - Product variant inventory
- `checkout:session:abc-123` - Checkout session state
- `discount:ruleset-bundle:5` - Discount ruleset version 5
- `cart:customer:cust-456` - Customer shopping cart

### TTL (Time-To-Live) Strategy

TTL values are carefully chosen based on data lifecycle:

```typescript
const TTL = {
  // Short-term operational data
  INVENTORY_RESERVATION: 15 * 60,    // 15 minutes
  CHECKOUT_LOCK: 10 * 60,           // 10 minutes
  CHECKOUT_SESSION: 60 * 60,        // 1 hour

  // Medium-term business data
  PAYMENT_INTENT: 24 * 60 * 60,     // 24 hours
  DISCOUNT_ELIGIBILITY: 24 * 60 * 60, // 24 hours
  BUNDLE_DEFINITION: 24 * 60 * 60,  // 24 hours

  // Long-term user data
  CART: 30 * 24 * 60 * 60,          // 30 days
  IDEMPOTENCY: 24 * 60 * 60,        // 24 hours
}
```

## Core Redis Stores

### 1. Inventory Store

**Purpose**: Real-time inventory management with atomic reservations

**Key Patterns:**
- `inventory:variant:{variantId}` → Available quantity
- `inventory:reserved:{variantId}` → Reserved quantity (aggregated)
- `inventory:reservation:{cartId}:{variantId}` → Individual reservations (TTL)

**Operations:**
- Atomic inventory reservation with Lua scripts
- Automatic reservation expiration and cleanup
- Real-time availability checks
- Inventory reconciliation on startup

### 2. Checkout Store

**Purpose**: State management for checkout process with strict consistency

**Key Patterns:**
- `checkout:session:{sessionId}` → Checkout state and metadata
- `checkout:metadata:{sessionId}` → Frozen pricing and discount data
- `payment:intent:{sessionId}` → Payment gateway integration data
- `checkout:lock:{cartId}` → Prevents concurrent checkout attempts

**State Machine:**
```
CREATED → LOCKED → PAYMENT_PENDING → PAYMENT_CONFIRMED → ORDER_CREATED → COMPLETED
```

### 3. Cart Store

**Purpose**: Shopping cart persistence and session management

**Key Patterns:**
- `cart:customer:{customerId}` → Customer's active cart
- `cart:session:{sessionId}` → Anonymous user cart

**Features:**
- Automatic cart merging for authenticated users
- Cart expiration and cleanup
- Bundle item support with complex pricing

### 4. Bundle Cache Store

**Purpose**: Performance optimization for bundle operations

**Key Patterns:**
- `bundle:{bundleId}:definition` → Complete bundle structure
- `bundle:{bundleId}:sets` → Bundle choice sets
- `bundle:{bundleId}:eligibility:{setId}` → Eligible variants per set

**Features:**
- Lazy loading with Redis caching
- Automatic cache invalidation on bundle updates
- Background cache warming

### 5. Discount Cache Store

**Purpose**: High-performance discount evaluation

**Key Patterns:**
- `discount:ruleset-bundle:{version}` → Versioned discount rules
- `discount:eligibility:{discountId}` → Eligible products per discount
- `discount-ruleset-version` → Current active version

**Features:**
- Atomic version upgrades with pub/sub notifications
- Background cache hydration
- Real-time hot reloading

### 6. Pricing Cache Store

**Purpose**: Optimized pricing calculations

**Key Patterns:**
- `pricing-ruleset-bundle:{version}` → Versioned pricing rules
- `pricing-ruleset-version` → Current active version

**Features:**
- Customer group pricing support
- Price list hierarchies
- Real-time pricing updates

## Redis Cluster Configuration

### Connection Management

```typescript
// Optimized Redis connection configuration
const redisOptions = {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis retry attempt ${times}, delay ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  // Connection pooling
  maxConnections: 10,
  minConnections: 2,
};
```

### Connection Pooling Strategy

```typescript
class RedisConnectionPool {
  private pool: Redis[] = [];
  private activeConnections = 0;

  async getConnection(): Promise<Redis> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    if (this.activeConnections < this.maxConnections) {
      const connection = await this.createConnection();
      this.activeConnections++;
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  releaseConnection(connection: Redis): void {
    if (this.waitQueue.length > 0) {
      const resolver = this.waitQueue.shift()!;
      resolver(connection);
    } else {
      this.pool.push(connection);
    }
  }
}
```

## Performance Optimization

### Memory Management

```typescript
// Efficient key storage patterns
interface RedisStoragePatterns {
  // Use hashes for related data
  userSession: {
    key: `user:session:${userId}`,
    fields: {
      cartId: string,
      preferences: string, // JSON string
      lastActivity: number,
    }
  },

  // Use sorted sets for ordered data
  recentProducts: {
    key: `products:recent:${categoryId}`,
    members: [{ score: timestamp, value: productId }]
  },

  // Use sets for membership testing
  productCategories: {
    key: `product:categories:${productId}`,
    members: ['category-1', 'category-2']
  }
}
```

### Query Optimization

```typescript
// Batch operations for performance
async function batchInventoryCheck(variantIds: string[]): Promise<Map<string, number>> {
  const pipeline = redis.pipeline();

  variantIds.forEach(variantId => {
    pipeline.get(KEY_PATTERNS.INVENTORY_VARIANT(variantId));
  });

  const results = await pipeline.exec();
  return new Map(
    variantIds.map((id, index) => [id, parseInt(results[index][1] || '0')])
  );
}
```

### Cache Invalidation Strategy

```typescript
// Smart cache invalidation patterns
class CacheInvalidationManager {
  // Invalidate by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Invalidate related caches
  async invalidateProductCaches(productId: string): Promise<void> {
    const patterns = [
      `product:details:${productId}`,
      `product:variants:${productId}:*`,
      `product:reviews:${productId}:*`,
      `search:products:*${productId}*`,
    ];

    await Promise.all(
      patterns.map(pattern => this.invalidatePattern(pattern))
    );
  }
}
```

## Monitoring & Observability

### Redis Metrics

```typescript
// Key performance indicators
const redisMetrics = {
  // Connection health
  connections_active: gauge,
  connections_idle: gauge,
  connection_errors_total: counter,

  // Operation latency
  operation_duration_seconds: histogram,

  // Cache hit rates
  cache_hits_total: counter,
  cache_misses_total: counter,

  // Memory usage
  memory_used_bytes: gauge,
  memory_fragmentation_ratio: gauge,

  // Keyspace statistics
  keys_total: gauge,
  keys_expired_total: counter,
  keys_evicted_total: counter,
};
```

### Health Checks

```typescript
// Comprehensive Redis health monitoring
async function checkRedisHealth(): Promise<HealthStatus> {
  try {
    // Basic connectivity
    await redis.ping();

    // Memory usage
    const memory = await redis.info('memory');
    const memoryUsage = parseInt(memory.match(/used_memory:(\d+)/)?.[1] || '0');

    // Connection count
    const clients = await redis.info('clients');
    const connectedClients = parseInt(
      clients.match(/connected_clients:(\d+)/)?.[1] || '0'
    );

    // Keyspace info
    const keyspace = await redis.info('keyspace');
    const totalKeys = keyspace.split('\n')
      .filter(line => line.includes('keys='))
      .reduce((sum, line) => {
        const keys = parseInt(line.match(/keys=(\d+)/)?.[1] || '0');
        return sum + keys;
      }, 0);

    return {
      status: 'healthy',
      metrics: {
        memoryUsage,
        connectedClients,
        totalKeys,
      }
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}
```

## High Availability & Disaster Recovery

### Redis Cluster Setup

```yaml
# Redis cluster configuration
redis-cluster:
  replicas: 3
  shards: 6
  persistence: aof  # Append-only file for durability

# Sentinel for automatic failover
redis-sentinel:
  quorum: 2
  down-after-milliseconds: 5000
  failover-timeout: 60000
```

### Backup Strategy

```bash
# Automated Redis backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli --rdb /backup/redis_$DATE.rdb

# Upload to cloud storage
aws s3 cp /backup/redis_$DATE.rdb s3://redis-backups/

# Cleanup old backups (keep last 30 days)
find /backup -name "redis_*.rdb" -mtime +30 -delete
```

### Failover Handling

```typescript
class RedisFailoverManager {
  private primaryClient: Redis;
  private replicaClients: Redis[];

  async handleFailover(): Promise<void> {
    // Detect primary failure
    this.primaryClient.on('error', async (error) => {
      logger.error('Redis primary failed:', error);

      // Promote replica to primary
      const newPrimary = await this.promoteReplica();

      // Update application configuration
      await this.updateConfiguration(newPrimary);

      // Log failover event
      await this.logFailoverEvent();
    });
  }

  async promoteReplica(): Promise<Redis> {
    // Implement replica promotion logic
    // Return new primary client
  }
}
```

## Security Considerations

### Access Control

```typescript
// Redis ACL (Access Control List) configuration
const redisAcl = `
# Admin user - full access
user admin on allkeys allcommands >admin_password

# Application user - restricted access
user app on ~app:* allcommands >app_password

# Read-only user - monitoring access
user monitor on allkeys info|ping|latency >monitor_password
`;

// Apply ACL rules
await redis.acl('SETUSER', 'app', 'on', '~app:*', 'allcommands', '>app_password');
```

### Encryption

```typescript
// TLS encryption for Redis connections
const tlsConfig = {
  key: fs.readFileSync('/path/to/client-key.pem'),
  cert: fs.readFileSync('/path/to/client-cert.pem'),
  ca: fs.readFileSync('/path/to/ca-cert.pem'),
  checkServerIdentity: (host: string, cert: any) => {
    // Custom certificate validation
    return tls.checkServerIdentity(host, cert);
  },
};

const secureRedis = new Redis({
  host: 'redis-cluster.example.com',
  port: 6380,
  tls: tlsConfig,
});
```

### Data Sanitization

```typescript
// Prevent injection attacks in Redis keys
function sanitizeRedisKey(key: string): string {
  // Remove null bytes and other dangerous characters
  return key.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

// Validate key patterns
function validateKeyPattern(key: string, pattern: RegExp): boolean {
  return pattern.test(key);
}

// Safe key generation
function generateSafeKey(prefix: string, id: string): string {
  const sanitizedId = sanitizeRedisKey(id);
  const fullKey = `${prefix}:${sanitizedId}`;

  if (!validateKeyPattern(fullKey, /^[\w:-]+$/)) {
    throw new Error('Invalid key pattern');
  }

  return fullKey;
}
```

## Migration & Scaling

### Data Migration

```typescript
class RedisMigrationManager {
  async migrateData(sourceRedis: Redis, targetRedis: Redis): Promise<void> {
    // Get all keys from source
    const keys = await sourceRedis.keys('*');

    // Migrate in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      // Dump and restore keys
      const pipeline = sourceRedis.pipeline();
      batch.forEach(key => pipeline.dump(key));

      const dumps = await pipeline.exec();

      // Restore to target
      const restorePipeline = targetRedis.pipeline();
      dumps.forEach(([err, dump], index) => {
        if (!err && dump) {
          const key = batch[index];
          restorePipeline.restore(key, 0, dump);
        }
      });

      await restorePipeline.exec();
    }
  }
}
```

### Scaling Strategies

```typescript
// Horizontal scaling with Redis Cluster
class RedisScaler {
  async addShard(newShardConfig: ShardConfig): Promise<void> {
    // Add new shard to cluster
    await this.cluster.addShard(newShardConfig);

    // Redistribute keys across shards
    await this.cluster.rebalance();

    // Update application configuration
    await this.updateAppConfig();
  }

  async removeShard(shardId: string): Promise<void> {
    // Migrate data from shard to others
    await this.cluster.migrateShard(shardId);

    // Remove shard from cluster
    await this.cluster.removeShard(shardId);

    // Update application configuration
    await this.updateAppConfig();
  }
}
```

## Best Practices

### Key Management
1. **Structured Naming**: Consistent key patterns across the application
2. **TTL Strategy**: Appropriate expiration times for different data types
3. **Key Size Limits**: Reasonable key lengths to prevent memory issues
4. **Namespace Isolation**: Separate keyspaces for different services

### Performance Optimization
1. **Connection Pooling**: Reuse connections to reduce overhead
2. **Pipeline Operations**: Batch multiple commands for efficiency
3. **Memory Optimization**: Use appropriate data structures
4. **Cache Warming**: Pre-populate frequently accessed data

### Reliability
1. **Error Handling**: Comprehensive error handling and recovery
2. **Circuit Breakers**: Fail gracefully during Redis outages
3. **Retry Logic**: Intelligent retry strategies for transient failures
4. **Monitoring**: Extensive monitoring and alerting

### Security
1. **Access Control**: Least privilege access patterns
2. **Encryption**: TLS encryption for data in transit
3. **Data Sanitization**: Prevent injection attacks
4. **Audit Logging**: Track all Redis operations

### Operational Excellence
1. **Backup Strategy**: Regular automated backups
2. **Disaster Recovery**: Comprehensive failover procedures
3. **Capacity Planning**: Monitor usage patterns and plan scaling
4. **Documentation**: Maintain detailed Redis architecture documentation