# Redis Caching Layers

The system implements sophisticated multi-layer caching with Redis to optimize performance across different data access patterns and consistency requirements.

## Cache Layer Architecture

### Three-Tier Caching Strategy

```
┌─────────────────────────────────────┐
│         Application Layer           │
├─────────────────────────────────────┤
│       Redis Cache Layers            │
│  ┌─────────────────────────────────┐ │
│  │    L1: Operational Cache        │ │ ← Real-time, atomic operations
│  │    (TTL: seconds to minutes)    │ │
│  ├─────────────────────────────────┤ │
│  │    L2: Application Cache        │ │ ← Business data, computed results
│  │    (TTL: hours to days)         │ │
│  ├─────────────────────────────────┤ │
│  │    L3: Session Store            │ │ ← User state, preferences
│  │    (TTL: days to weeks)         │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│       PostgreSQL Database           │ ← Authoritative source
└─────────────────────────────────────┘
```

## Layer 1: Operational Cache

### Purpose
Real-time operational data requiring strong consistency and atomic operations.

### Characteristics
- **TTL**: Seconds to minutes
- **Consistency**: Strong consistency with atomic operations
- **Examples**: Inventory levels, checkout state, payment intents
- **Failure Impact**: High - affects core business operations

### Key Patterns

#### Inventory Cache
```typescript
class InventoryCache {
  // Real-time inventory with atomic reservations
  async reserveInventory(variantId: string, quantity: number, cartId: string): Promise<boolean> {
    const script = loadLuaScript('reserve-inventory.lua');
    const result = await redis.eval(script, [
      KEY_PATTERNS.INVENTORY_VARIANT(variantId),
      KEY_PATTERNS.INVENTORY_RESERVED(variantId),
      KEY_PATTERNS.INVENTORY_RESERVATION(cartId, variantId),
    ], [quantity, TTL.INVENTORY_RESERVATION]);

    return result === 'OK';
  }

  // Atomic inventory reconciliation
  async reconcileInventory(variantId: string): Promise<void> {
    const script = loadLuaScript('reconcile-inventory.lua');
    await redis.eval(script, [
      KEY_PATTERNS.INVENTORY_VARIANT(variantId),
      KEY_PATTERNS.INVENTORY_RESERVED(variantId),
      KEY_PATTERNS.INVENTORY_RESERVATION(variantId, '*'), // Pattern match
    ]);
  }
}
```

#### Checkout State Cache
```typescript
class CheckoutCache {
  // Atomic state transitions
  async transitionState(sessionId: string, fromState: string, toState: string): Promise<boolean> {
    const script = loadLuaScript('transition-state.lua');
    const result = await redis.eval(script, [
      KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
    ], [fromState, toState]);

    return result === 'OK';
  }

  // Lock checkout to prevent concurrent operations
  async acquireLock(cartId: string): Promise<boolean> {
    return await redis.set(
      KEY_PATTERNS.CHECKOUT_LOCK(cartId),
      'locked',
      'EX',
      TTL.CHECKOUT_LOCK,
      'NX' // Only if not exists
    ) === 'OK';
  }
}
```

### Cache Invalidation Strategy

#### Event-Driven Invalidation
```typescript
class OperationalCacheInvalidator {
  async invalidateInventory(variantId: string): Promise<void> {
    // Invalidate all inventory-related caches
    const keys = await redis.keys(`inventory:*:${variantId}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Publish invalidation event
    await redis.publish('cache-invalidation', JSON.stringify({
      type: 'inventory',
      variantId,
      timestamp: Date.now(),
    }));
  }
}
```

## Layer 2: Application Cache

### Purpose
Performance optimization for frequently accessed business data with eventual consistency.

### Characteristics
- **TTL**: Hours to days
- **Consistency**: Eventual consistency with background refresh
- **Examples**: Product details, discount rules, bundle definitions
- **Failure Impact**: Medium - affects performance, not correctness

### Key Patterns

#### Product Cache
```typescript
class ProductCache {
  async getProduct(productId: string): Promise<Product | null> {
    const cacheKey = `product:details:${productId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - fetch from database
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId)
    });

    if (product) {
      // Cache with TTL
      await redis.setex(cacheKey, TTL.PRODUCT_DETAILS, JSON.stringify(product));
    }

    return product;
  }

  async invalidateProduct(productId: string): Promise<void> {
    const keys = await redis.keys(`product:*:${productId}`);
    await redis.del(...keys);
  }
}
```

#### Discount Rules Cache
```typescript
class DiscountCache {
  // Versioned cache for atomic updates
  async getDiscountRules(): Promise<DiscountRules> {
    const versionKey = KEY_PATTERNS.DISCOUNT_RULESET_VERSION();
    const version = await redis.get(versionKey);

    if (!version) {
      return this.loadAndCacheRules();
    }

    const cacheKey = KEY_PATTERNS.DISCOUNT_RULESET_BUNDLE(parseInt(version));
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.loadAndCacheRules();
  }

  async loadAndCacheRules(): Promise<DiscountRules> {
    // Load from database
    const rules = await this.loadRulesFromDatabase();

    // Increment version atomically
    const newVersion = await redis.incr(KEY_PATTERNS.DISCOUNT_RULESET_VERSION());

    // Cache new version
    const cacheKey = KEY_PATTERNS.DISCOUNT_RULESET_BUNDLE(newVersion);
    await redis.setex(cacheKey, TTL.DISCOUNT_RULES, JSON.stringify(rules));

    return rules;
  }
}
```

### Background Cache Warming

#### Proactive Cache Population
```typescript
class CacheWarmer {
  @Cron('0 */6 * * *') // Every 6 hours
  async warmProductCache(): Promise<void> {
    const products = await db.query.products.findMany({
      where: eq(products.status, 'active'),
      limit: 1000,
    });

    const pipeline = redis.pipeline();
    products.forEach(product => {
      const cacheKey = `product:details:${product.id}`;
      pipeline.setex(cacheKey, TTL.PRODUCT_DETAILS, JSON.stringify(product));
    });

    await pipeline.exec();
  }

  @Cron('0 */2 * * *') // Every 2 hours
  async warmDiscountCache(): Promise<void> {
    await discountCache.loadAndCacheRules();
  }
}
```

### Smart Cache Invalidation

#### Dependency-Based Invalidation
```typescript
class SmartInvalidator {
  private dependencies = new Map<string, Set<string>>();

  // Track cache dependencies
  trackDependency(cacheKey: string, dependsOn: string): void {
    if (!this.dependencies.has(dependsOn)) {
      this.dependencies.set(dependsOn, new Set());
    }
    this.dependencies.get(dependsOn)!.add(cacheKey);
  }

  // Invalidate all dependent caches
  async invalidateWithDependencies(primaryKey: string): Promise<void> {
    const dependentKeys = this.dependencies.get(primaryKey) || new Set();

    if (dependentKeys.size > 0) {
      await redis.del(primaryKey, ...dependentKeys);
    } else {
      await redis.del(primaryKey);
    }
  }
}
```

## Layer 3: Session Store

### Purpose
User session management and temporary state persistence.

### Characteristics
- **TTL**: Days to weeks
- **Consistency**: Session-scoped consistency
- **Examples**: Shopping carts, user preferences, temporary selections
- **Failure Impact**: Low - affects user experience, recoverable

### Key Patterns

#### Shopping Cart Store
```typescript
class CartStore {
  async getCart(customerId: string): Promise<Cart> {
    const cacheKey = KEY_PATTERNS.CART_CUSTOMER(customerId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Create empty cart if none exists
    const cart = {
      id: randomUUID(),
      customerId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await redis.setex(cacheKey, TTL.CART, JSON.stringify(cart));
    return cart;
  }

  async updateCart(customerId: string, updates: Partial<Cart>): Promise<void> {
    const cart = await this.getCart(customerId);
    const updatedCart = { ...cart, ...updates, updatedAt: new Date() };

    const cacheKey = KEY_PATTERNS.CART_CUSTOMER(customerId);
    await redis.setex(cacheKey, TTL.CART, JSON.stringify(updatedCart));
  }

  async mergeCarts(anonymousId: string, customerId: string): Promise<void> {
    const anonymousCart = await this.getCartBySession(anonymousId);
    const customerCart = await this.getCart(customerId);

    // Merge logic here...
    const mergedCart = this.mergeCartItems(customerCart, anonymousCart);

    // Update customer cart and delete anonymous
    await Promise.all([
      redis.setex(KEY_PATTERNS.CART_CUSTOMER(customerId), TTL.CART, JSON.stringify(mergedCart)),
      redis.del(KEY_PATTERNS.CART_SESSION(anonymousId)),
    ]);
  }
}
```

#### User Preferences Store
```typescript
class UserPreferencesStore {
  async getPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `user:preferences:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Load from database or create defaults
    const preferences = await this.loadPreferencesFromDatabase(userId);
    await redis.setex(cacheKey, TTL.USER_PREFERENCES, JSON.stringify(preferences));

    return preferences;
  }

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...updates };

    const cacheKey = `user:preferences:${userId}`;
    await redis.setex(cacheKey, TTL.USER_PREFERENCES, JSON.stringify(updated));

    // Persist to database asynchronously
    this.persistToDatabase(userId, updated);
  }
}
```

## Cache Performance Monitoring

### Hit Rate Tracking
```typescript
class CacheMetricsCollector {
  private hits = new Map<string, number>();
  private misses = new Map<string, number>();

  async trackCacheAccess(cacheKey: string, hit: boolean): Promise<void> {
    const key = cacheKey.split(':')[0]; // Extract cache type

    if (hit) {
      this.hits.set(key, (this.hits.get(key) || 0) + 1);
    } else {
      this.misses.set(key, (this.misses.get(key) || 0) + 1);
    }

    // Report metrics periodically
    await this.reportMetrics();
  }

  private async reportMetrics(): Promise<void> {
    for (const [cacheType, hits] of this.hits) {
      const misses = this.misses.get(cacheType) || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;

      // Report to metrics system
      metrics.gauge(`cache_hit_rate{type="${cacheType}"}`, hitRate);
    }
  }
}
```

### Performance Analysis
```typescript
class CachePerformanceAnalyzer {
  async analyzeCachePerformance(): Promise<CacheAnalysis> {
    const info = await redis.info();

    return {
      memoryUsage: parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0'),
      totalKeys: parseInt(info.match(/total_keys:(\d+)/)?.[1] || '0'),
      evictedKeys: parseInt(info.match(/evicted_keys:(\d+)/)?.[1] || '0'),
      expiredKeys: parseInt(info.match(/expired_keys:(\d+)/)?.[1] || '0'),
      keyspaceHits: parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0'),
      keyspaceMisses: parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0'),
    };
  }

  async getSlowCacheOperations(): Promise<SlowOperation[]> {
    // Monitor Redis slowlog
    const slowlog = await redis.slowlog('get', 100);

    return slowlog.map(entry => ({
      id: entry[0],
      timestamp: entry[1],
      duration: entry[2],
      command: entry[3],
    }));
  }
}
```

## Cache Consistency Strategies

### Write-Through Cache
```typescript
class WriteThroughCache {
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    // Update database first
    await db.update(products)
      .set(updates)
      .where(eq(products.id, productId));

    // Then update cache
    const cacheKey = `product:details:${productId}`;
    const current = await this.getProduct(productId);
    const updated = { ...current, ...updates };

    await redis.setex(cacheKey, TTL.PRODUCT_DETAILS, JSON.stringify(updated));
  }
}
```

### Write-Behind Cache
```typescript
class WriteBehindCache {
  private queue: UpdateOperation[] = [];

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    // Update cache immediately
    const cacheKey = `product:details:${productId}`;
    const current = await this.getProduct(productId);
    const updated = { ...current, ...updates };

    await redis.setex(cacheKey, TTL.PRODUCT_DETAILS, JSON.stringify(updated));

    // Queue database update
    this.queue.push({
      type: 'update',
      table: 'products',
      id: productId,
      data: updates,
    });

    // Process queue asynchronously
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // Batch database updates
    // Implement conflict resolution
  }
}
```

### Cache-Aside Pattern
```typescript
class CacheAsideManager {
  async getData(key: string): Promise<any> {
    // Try cache first
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - load from database
    const data = await this.loadFromDatabase(key);

    // Populate cache
    await redis.setex(key, this.getTTL(key), JSON.stringify(data));

    return data;
  }

  async updateData(key: string, data: any): Promise<void> {
    // Update database
    await this.saveToDatabase(key, data);

    // Update cache
    await redis.setex(key, this.getTTL(key), JSON.stringify(data));
  }
}
```

## Cache Failure Handling

### Graceful Degradation
```typescript
class ResilientCache {
  async getWithFallback(key: string, fallbackFn: () => Promise<any>): Promise<any> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      // Log cache failure but don't fail request
      logger.warn('Cache read failed:', error);
    }

    // Fallback to direct database access
    return await fallbackFn();
  }

  async setWithFallback(key: string, value: any, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      // Log cache write failure but don't fail request
      logger.warn('Cache write failed:', error);
      // Continue with request - data will be cached on next read
    }
  }
}
```

### Circuit Breaker Pattern
```typescript
class CacheCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute(operation: () => Promise<any>): Promise<any> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Cache circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
}
```

## Cache Size Management

### Memory-Efficient Storage
```typescript
class MemoryEfficientCache {
  // Use compression for large objects
  async setCompressed(key: string, data: any, ttl: number): Promise<void> {
    const jsonString = JSON.stringify(data);
    const compressed = await gzip(jsonString);

    await redis.setex(`${key}:compressed`, ttl, compressed.toString('base64'));
    await redis.setex(`${key}:metadata`, ttl, JSON.stringify({
      compressed: true,
      originalSize: jsonString.length,
      compressedSize: compressed.length,
    }));
  }

  async getCompressed(key: string): Promise<any> {
    const metadata = await redis.get(`${key}:metadata`);
    if (!metadata) return null;

    const { compressed } = JSON.parse(metadata);
    if (!compressed) {
      return JSON.parse(await redis.get(key));
    }

    const compressedData = await redis.get(`${key}:compressed`);
    const decompressed = await gunzip(Buffer.from(compressedData, 'base64'));
    return JSON.parse(decompressed.toString());
  }
}
```

### Intelligent Eviction
```typescript
class IntelligentEvictor {
  async evictStaleData(): Promise<void> {
    // Evict expired sessions
    const expiredSessions = await redis.keys('cart:session:*');
    // Check TTL and evict if expired

    // Evict low-access products
    const lowAccessProducts = await this.findLowAccessProducts();
    await redis.del(...lowAccessProducts);

    // Evict old search results
    const oldSearches = await redis.keys('search:*:*');
    // Implement LRU eviction
  }

  private async findLowAccessProducts(): Promise<string[]> {
    // Use Redis OBJECT command to get access info
    const productKeys = await redis.keys('product:details:*');

    const accessInfo = await Promise.all(
      productKeys.map(async (key) => {
        const idle = await redis.object('idletime', key);
        return { key, idle: parseInt(idle || '0') };
      })
    );

    // Return keys with high idle time
    return accessInfo
      .filter(info => info.idle > 3600) // 1 hour
      .map(info => info.key);
  }
}
```

## Best Practices

### Cache Design Principles
1. **Appropriate TTL**: Match TTL to data volatility and access patterns
2. **Size Limits**: Prevent cache from growing unbounded
3. **Consistency Model**: Choose consistency level based on requirements
4. **Monitoring**: Comprehensive monitoring and alerting

### Performance Optimization
1. **Connection Pooling**: Efficient Redis connection management
2. **Pipeline Operations**: Batch multiple operations
3. **Serialization**: Efficient data serialization and compression
4. **Memory Layout**: Optimize data structures for Redis

### Reliability
1. **Error Handling**: Graceful degradation on cache failures
2. **Circuit Breakers**: Prevent cascade failures
3. **Retry Logic**: Intelligent retry strategies
4. **Fallback Mechanisms**: Alternative data access paths

### Operational Excellence
1. **Metrics Collection**: Comprehensive performance metrics
2. **Capacity Planning**: Monitor cache usage and plan scaling
3. **Backup Strategy**: Include cache data in backup procedures
4. **Documentation**: Maintain cache architecture documentation
