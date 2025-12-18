# Checkout System Overview

## State Machine

The checkout process follows a state machine pattern:

```mermaid
stateDiagram-v2
    [*] --> CART_PENDING: Add items
    CART_PENDING --> CHECKOUT_STARTED: Initiate checkout
    CHECKOUT_STARTED --> PAYMENT_PENDING: Payment intent created
    PAYMENT_PENDING --> PAYMENT_CONFIRMED: Payment successful
    PAYMENT_CONFIRMED --> ORDER_CREATED: Order created
    ORDER_CREATED --> [*]
    
    PAYMENT_PENDING --> CART_PENDING: Payment failed
    CHECKOUT_STARTED --> CART_PENDING: Cancel checkout
```

## Checkout Flow

```mermaid
sequenceDiagram
    participant Client
    participant Checkout
    participant Cart
    participant Pricing
    participant Discounts
    participant Inventory
    participant Payments
    participant Orders
    
    Client->>Checkout: Start checkout
    Checkout->>Cart: Get cart items
    Cart-->>Checkout: Items
    Checkout->>Pricing: Calculate prices
    Pricing-->>Checkout: Prices
    Checkout->>Discounts: Apply discounts
    Discounts-->>Checkout: Discounted prices
    Checkout->>Inventory: Reserve inventory
    Inventory-->>Checkout: Reserved
    Checkout->>Payments: Create payment intent
    Payments-->>Checkout: Payment intent
    Checkout-->>Client: Checkout session
    
    Client->>Payments: Confirm payment
    Payments->>Orders: Create order
    Orders->>Inventory: Commit inventory
    Orders-->>Client: Order created
```

## Checkout States

### CART_PENDING
- Cart has items
- No checkout session active
- Items can be modified

### CHECKOUT_STARTED
- Checkout session created
- Cart locked (no modifications)
- Inventory reserved
- Session stored in Redis

### PAYMENT_PENDING
- Payment intent created
- Waiting for payment confirmation
- Inventory still reserved
- Session expires after timeout

### PAYMENT_CONFIRMED
- Payment successful
- Order creation in progress
- Inventory committed

### ORDER_CREATED
- Order created successfully
- Checkout session completed
- Inventory committed

## Inventory Flow

```mermaid
flowchart TD
    A[Start Checkout] --> B[Reserve Inventory]
    B --> C{Reservation Success?}
    C -->|Yes| D[Create Payment Intent]
    C -->|No| E[Return Error]
    D --> F{Payment Success?}
    F -->|Yes| G[Commit Inventory]
    F -->|No| H[Release Inventory]
    G --> I[Create Order]
    H --> J[Return to Cart]
    
    style G fill:#51cf66
    style E fill:#ff6b6b
    style H fill:#ffd93d
```

## Payment Intent Creation

Payment intents are created via Razorpay:

1. Calculate total amount (prices + discounts + shipping)
2. Create Razorpay order
3. Store payment intent in checkout session
4. Return payment details to client

## Webhook Reconciliation

Payment webhooks reconcile payments:

1. **Payment Success**: Create order, commit inventory
2. **Payment Failed**: Release inventory, unlock cart
3. **Idempotency**: Prevent duplicate order creation

## Redis Session Storage

Checkout sessions stored in Redis:

- **Key Pattern**: `checkout:session:{sessionId}`
- **TTL**: 30 minutes (configurable)
- **Data**: Cart items, pricing, discounts, payment intent

## Guest Checkout

The system supports guest checkout, allowing customers to complete purchases without creating an account. See [Guest Checkout Documentation](/docs/checkout/guest-checkout) for details.

### Guest vs Authenticated Checkout

- **Authenticated**: Requires JWT token, uses existing customer and addresses
- **Guest**: Public endpoint, creates customer on-the-fly, requires session ID

Both flows use the same order creation pipeline and payment processing.

## API Endpoints

- `POST /orders` - Create payment intent (supports both authenticated and guest checkout)
- `GET /orders` - List orders (authenticated only)
- `GET /orders/:id` - Get order (authenticated only)
- `POST /customers/claim` - Claim guest account (public)

## Error Handling

- **Inventory Unavailable**: Release reservation, return error
- **Payment Failed**: Release inventory, unlock cart
- **Session Expired**: Return error, require new checkout
- **Concurrent Modifications**: Use Redis locks

