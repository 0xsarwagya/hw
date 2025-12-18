# Checkout State Machine

The checkout system implements a robust state machine that ensures transactional consistency and prevents race conditions during the purchase process. The state machine coordinates cart locking, payment processing, and order creation with atomic transitions.

## State Definitions

### Core States

```typescript
enum CheckoutState {
  CREATED = "CREATED",           // Initial state after cart conversion
  LOCKED = "LOCKED",             // Cart locked, inventory reserved
  PAYMENT_PENDING = "PAYMENT_PENDING",  // Payment intent created
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",  // Payment verified
  ORDER_CREATED = "ORDER_CREATED",   // Order record created
  COMPLETED = "COMPLETED",       // Checkout fully processed
  FAILED = "FAILED",             // Checkout failed (terminal)
}
```

### Terminal States
- **COMPLETED**: Successful checkout completion
- **FAILED**: Checkout failure (payment declined, inventory issues, etc.)

## State Transition Rules

### Valid Transitions

```typescript
const TRANSITION_RULES = {
  [CREATED]: [LOCKED],
  [LOCKED]: [PAYMENT_PENDING, FAILED],
  [PAYMENT_PENDING]: [PAYMENT_CONFIRMED, FAILED],
  [PAYMENT_CONFIRMED]: [ORDER_CREATED],
  [ORDER_CREATED]: [COMPLETED],
  [COMPLETED]: [], // Terminal
  [FAILED]: [],    // Terminal
}
```

### Transition Flow

```
CREATED → LOCKED → PAYMENT_PENDING → PAYMENT_CONFIRMED → ORDER_CREATED → COMPLETED
    ↓         ↓
  FAILED    FAILED
```

## Checkout Session Data Structure

### Session State
```typescript
interface CheckoutSession {
  state: CheckoutState;
  cartId: string;
  paymentIntentId: string | null;
  orderId: string | null;
  updatedAt: string;
}
```

### Metadata Storage
```typescript
interface CheckoutMetadata {
  customerId: string;
  userId: string | null;
  shippingAddressId: string;
  billingAddressId: string;
  shippingCost: number;
  discountSnapshot: DiscountSnapshot | null;
  pricingSnapshot: PricingSnapshot | null;
  createdAt: string;
}
```

## State Machine Implementation

### Atomic Transitions
The state machine uses Lua scripts in Redis to ensure atomic state transitions:

```lua
-- transition-state.lua
local key = KEYS[1]
local expectedState = ARGV[1]
local newState = ARGV[2]
local metadata = ARGV[3]

-- Get current state
local current = redis.call('GET', key)
if not current then
    return redis.call('SET', key, newState)
end

-- Validate transition
if current ~= expectedState then
    return redis.call('ERROR', 'Invalid transition')
end

-- Atomic transition
redis.call('SET', key, newState)
if metadata then
    redis.call('SET', key .. ':metadata', metadata)
end

return 'OK'
```

### Transition Validation
```typescript
function validateTransition(from: CheckoutState, to: CheckoutState): void {
  if (!TRANSITION_RULES[from].includes(to) && from !== to) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}
```

## Checkout Process Flow

### 1. Cart to Checkout Conversion

**State**: `CREATED`
**Action**: Convert cart to checkout session

```typescript
async createCheckout(cartId: string): Promise<CheckoutSession> {
  // Validate cart exists and has items
  // Create checkout session with CREATED state
  // Return session ID for frontend tracking
}
```

### 2. Inventory Locking

**State**: `CREATED → LOCKED`
**Action**: Reserve inventory for all cart items

```typescript
async lockCheckout(checkoutId: string): Promise<void> {
  // Reserve inventory for each variant
  // Calculate final pricing with discounts
  // Store pricing and discount snapshots
  // Transition to LOCKED state
}
```

**Atomic Operation**:
- Reserve all inventory or fail completely
- Calculate and freeze pricing
- Store immutable snapshots

### 3. Payment Intent Creation

**State**: `LOCKED → PAYMENT_PENDING`
**Action**: Create payment gateway intent

```typescript
async createPaymentIntent(checkoutId: string): Promise<PaymentIntent> {
  // Get checkout metadata
  // Create Razorpay order
  // Store payment intent ID
  // Transition to PAYMENT_PENDING
}
```

**Payment Intent Data**:
```typescript
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  orderId: string | null;
}
```

### 4. Payment Confirmation

**State**: `PAYMENT_PENDING → PAYMENT_CONFIRMED`
**Action**: Verify payment completion

```typescript
async confirmPayment(checkoutId: string, paymentId: string): Promise<void> {
  // Verify payment with Razorpay
  // Update payment intent status
  // Transition to PAYMENT_CONFIRMED
}
```

### 5. Order Creation

**State**: `PAYMENT_CONFIRMED → ORDER_CREATED`
**Action**: Create order record

```typescript
async createOrder(checkoutId: string): Promise<Order> {
  // Create order from checkout metadata
  // Consume reserved inventory
  // Store order ID in session
  // Transition to ORDER_CREATED
}
```

### 6. Checkout Completion

**State**: `ORDER_CREATED → COMPLETED`
**Action**: Finalize checkout

```typescript
async completeCheckout(checkoutId: string): Promise<void> {
  // Send order confirmation
  // Clean up checkout session
  // Transition to COMPLETED
}
```

## Error Handling & Recovery

### Failure Scenarios

#### Inventory Unavailable
```
LOCKED → FAILED
```
- Release all reserved inventory
- Mark checkout as failed
- Notify customer of stock issues

#### Payment Declined
```
PAYMENT_PENDING → FAILED
```
- Release inventory reservations
- Cancel payment intent
- Mark checkout as failed

#### Order Creation Failure
```
PAYMENT_CONFIRMED → FAILED
```
- Refund payment if possible
- Release inventory reservations
- Alert administrators

### Recovery Mechanisms

#### Session Expiration
- Automatic cleanup after TTL (30 minutes)
- Inventory reservations released
- Payment intents cancelled

#### Manual Recovery
```typescript
async recoverFailedCheckout(checkoutId: string): Promise<void> {
  // Assess current state
  // Attempt recovery based on failure point
  // Manual intervention for complex cases
}
```

## Redis Key Patterns

### Checkout Session Keys
```
checkout:session:{checkoutId} → CheckoutSession
checkout:session:{checkoutId}:metadata → CheckoutMetadata
checkout:session:{checkoutId}:payment → PaymentIntent
```

### Expiration Strategy
- **Active Sessions**: 30-minute TTL
- **Completed Sessions**: Immediate cleanup
- **Failed Sessions**: 24-hour retention for debugging

## API Endpoints

### Checkout Lifecycle
```http
# Create checkout from cart
POST /storefront/checkout
{
  "cartId": "cart-123",
  "customerId": "customer-456"
}

# Lock checkout (reserve inventory)
POST /storefront/checkout/{checkoutId}/lock

# Create payment intent
POST /storefront/checkout/{checkoutId}/payment-intent

# Confirm payment
POST /storefront/checkout/{checkoutId}/confirm-payment
{
  "paymentId": "pay_123",
  "orderId": "order_123"
}

# Complete checkout
POST /storefront/checkout/{checkoutId}/complete
```

### Admin Operations
```http
# Get checkout session details
GET /admin/checkout/{checkoutId}

# Force state transition (emergency)
POST /admin/checkout/{checkoutId}/transition
{
  "toState": "FAILED",
  "reason": "Payment timeout"
}

# List active checkouts
GET /admin/checkout/active
```

## Monitoring & Observability

### State Transition Metrics
```typescript
// Track state transition times
checkout_state_transition_duration: histogram

// Count state transitions
checkout_state_transitions_total: counter

// Track failed checkouts
checkout_failures_total: counter
```

### Business Metrics
```typescript
// Checkout conversion rates
checkout_conversion_rate: gauge

// Average checkout completion time
checkout_completion_duration: histogram

// Checkout abandonment rate
checkout_abandonment_rate: gauge
```

## Performance Optimization

### Caching Strategy
- **Session Data**: Cached in Redis with TTL
- **Pricing Snapshots**: Immutable after locking
- **Inventory Checks**: Cached during active sessions

### Concurrency Control
- **Atomic Operations**: Lua scripts prevent race conditions
- **Optimistic Locking**: Version-based conflict resolution
- **Sequential Processing**: Single-threaded state transitions

## Security Considerations

### Data Protection
- **Sensitive Data**: Encrypted in transit and at rest
- **Access Control**: Customer-scoped checkout access
- **Audit Trail**: Complete state change history

### Fraud Prevention
- **Session Validation**: Verify session ownership
- **Payment Verification**: Gateway callback validation
- **Rate Limiting**: Prevent checkout spam

## Best Practices

### State Machine Design
1. **Explicit States**: No inferred state, explicit fields only
2. **Atomic Transitions**: All-or-nothing state changes
3. **Validation**: Strict transition rules enforced
4. **Recovery**: Clear failure and recovery paths

### Business Logic
1. **Inventory First**: Reserve before payment to prevent overselling
2. **Snapshot Pricing**: Freeze prices at checkout time
3. **Idempotent Operations**: Safe retry of failed operations
4. **Cleanup**: Automatic resource cleanup on failures

### Monitoring
1. **State Distribution**: Track checkout states over time
2. **Failure Analysis**: Identify common failure points
3. **Performance Tracking**: Monitor checkout completion times
4. **Conversion Optimization**: Analyze abandonment points
