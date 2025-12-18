# Discount Definitions

The discount system supports multiple discount types and complex targeting rules for flexible pricing strategies. Discounts can be applied automatically or manually, with support for various value types and application scopes.

## Discount Types

### 1. Fixed Amount Discount
```typescript
type: "FIXED_AMOUNT"
value: 100          // Fixed amount in INR
valueType: "AMOUNT"
scope: "PRODUCT" | "ORDER"
```

**Example**: ₹100 off on selected products or entire order.

### 2. Percentage Discount
```typescript
type: "PERCENTAGE"
value: 20           // 20% discount
valueType: "PERCENTAGE"
scope: "PRODUCT" | "ORDER"
```

**Example**: 20% off on selected products or entire order.

### 3. Buy X Get Y Discount
```typescript
type: "BUY_X_GET_Y"
value: 50           // 50% off on Y items
valueType: "PERCENTAGE"
scope: "PRODUCT"
buyQuantity: 2      // Buy 2 items
getQuantity: 1      // Get 1 item at discount
```

**Example**: Buy 2, Get 1 at 50% off.

### 4. Tiered Discount
```typescript
type: "TIERED"
valueType: "PERCENTAGE" | "AMOUNT"
scope: "PRODUCT" | "ORDER"
tieredRules: [
  { minQuantity: 1, value: 10 },  // 10% off for 1+ items
  { minQuantity: 5, value: 20 },  // 20% off for 5+ items
  { minQuantity: 10, value: 30 }  // 30% off for 10+ items
]
```

**Example**: Quantity-based progressive discounts.

### 5. Cart Level Discount
```typescript
type: "CART_LEVEL"
value: 500          // ₹500 off
valueType: "AMOUNT"
scope: "ORDER"
minCartValue: 2000  // Minimum cart value ₹2000
```

**Example**: ₹500 off on orders over ₹2000.

## Application Types

### Automatic Discounts
- Applied automatically during checkout
- No customer action required
- Based on cart contents and rules

### Manual Discounts
- Applied by customer using discount code
- Requires explicit code entry
- Can have usage limits and restrictions

## Value Types

### Amount-based
- Fixed monetary value (₹100 off)
- Consistent across all products
- Simple calculation

### Percentage-based
- Percentage of product/order price
- Scales with product value
- More flexible for different price points

## Scopes

### Product Scope
- Discount applies to individual products
- Can target specific products, categories, collections
- Supports quantity-based rules

### Order Scope
- Discount applies to entire order
- Cart-level discounts
- Order minimum requirements

## Targeting Rules

### Product Targeting
```typescript
// Target specific products
productIds: ["product-1", "product-2"]

// Target product categories
categoryIds: ["category-1", "category-2"]

// Target collections (planned)
collectionIds: ["collection-1", "collection-2"]

// Target by tags (planned)
tagIds: ["summer", "clearance"]
```

### Customer Targeting (Future)
```typescript
// Target specific customers
customerIds: ["customer-1", "customer-2"]

// Target customer groups
customerGroupIds: ["vip", "wholesale"]

// Geographic targeting
regions: ["IN", "US"]
```

## Usage Limits

### Per Customer
```typescript
usageLimit: 1        // One use per customer
usageCount: 0        // Current usage count
```

### Total Usage
```typescript
totalUsageLimit: 100  // Maximum total uses
totalUsageCount: 0    // Current total uses
```

### Time Limits
```typescript
startsAt: "2025-01-01T00:00:00Z"
endsAt: "2025-12-31T23:59:59Z"
```

## Discount Stacking

### Priority System
- Discounts sorted by priority (lower number = higher priority)
- Higher priority discounts applied first
- Lower priority discounts applied to remaining amount

### Stackability Rules
- Some discounts can stack
- Others are mutually exclusive
- Configurable stacking behavior

### Example Stacking
```typescript
// Discount A: 10% off (priority: 1)
// Discount B: ₹100 off (priority: 2)
// Final price: Apply 10% first, then ₹100 off remaining
```

## Validation Rules

### Business Rules
- **Code Uniqueness**: Each discount code must be unique
- **Date Validation**: End date must be after start date
- **Value Limits**: Percentage discounts ≤ 100%
- **Quantity Logic**: Buy quantity ≥ get quantity for BOGO
- **Target Consistency**: At least one targeting rule required

### Technical Validation
- **Type Consistency**: Value type matches discount type
- **Scope Compatibility**: Application scope matches discount type
- **Target Existence**: Referenced products/categories must exist

## Calculation Engine

### Discount Resolution
1. **Filter Applicable Discounts**: Based on targeting rules
2. **Sort by Priority**: Lower priority number first
3. **Calculate Impact**: Apply each discount in order
4. **Handle Conflicts**: Resolve stacking conflicts
5. **Update Totals**: Recalculate order totals

### Complex Scenarios
```typescript
// Scenario: Multiple discounts on same product
Product Price: ₹1000
- Discount A: 20% off (priority 1) → ₹800
- Discount B: ₹100 off (priority 2) → ₹700
- Final: ₹700

// Scenario: BOGO + percentage
Buy 2 Pay 1: Buy 2×₹500 = ₹1000, Get 1×₹500 at 50% = ₹250
Total: ₹1000 + ₹250 = ₹1250 (instead of ₹1500)
```

## API Examples

### Create Fixed Amount Discount
```http
POST /admin/discounts
Content-Type: application/json

{
  "code": "SAVE100",
  "name": "Save ₹100",
  "description": "₹100 off on orders over ₹500",
  "type": "FIXED_AMOUNT",
  "value": 100,
  "valueType": "AMOUNT",
  "scope": "ORDER",
  "applicationType": "AUTOMATIC",
  "minCartValue": 500,
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-12-31T23:59:59Z",
  "priority": 10
}
```

### Create Buy X Get Y Discount
```http
POST /admin/discounts
Content-Type: application/json

{
  "code": "BUY2GET1",
  "name": "Buy 2 Get 1 Free",
  "description": "Buy 2 items, get 1 free",
  "type": "BUY_X_GET_Y",
  "value": 100,
  "valueType": "PERCENTAGE",
  "scope": "PRODUCT",
  "applicationType": "AUTOMATIC",
  "buyQuantity": 2,
  "getQuantity": 1,
  "productIds": ["product-1", "product-2"],
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-12-31T23:59:59Z",
  "priority": 5
}
```

### Create Tiered Discount
```http
POST /admin/discounts
Content-Type: application/json

{
  "code": "BULK10",
  "name": "Bulk Discount",
  "description": "10% off for 3+, 20% off for 5+",
  "type": "TIERED",
  "valueType": "PERCENTAGE",
  "scope": "PRODUCT",
  "applicationType": "AUTOMATIC",
  "tieredRules": [
    { "minQuantity": 3, "value": 10 },
    { "minQuantity": 5, "value": 20 }
  ],
  "categoryIds": ["category-1"],
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-12-31T23:59:59Z",
  "priority": 15
}
```

## Performance Considerations

### Caching Strategy
- **Discount Rules**: Cached in Redis for fast access
- **Targeting Data**: Pre-computed product relationships
- **Calculation Results**: Cached for repeated calculations

### Database Optimization
- **Indexes**: On frequently queried fields (code, dates, status)
- **Relationships**: Optimized foreign key constraints
- **Bulk Operations**: Batch discount calculations

### Monitoring
- **Usage Tracking**: Real-time discount usage analytics
- **Performance Metrics**: Calculation time and success rates
- **Business Metrics**: Revenue impact and conversion rates

## Integration Points

### Cart System
- Real-time discount calculation during cart updates
- Automatic discount application based on rules
- Cart validation with discount constraints

### Checkout Process
- Discount validation before payment
- Final price calculation with all applicable discounts
- Order total updates with discount details

### Order Management
- Historical discount tracking on orders
- Refund calculations considering discounts
- Analytics and reporting on discount effectiveness

### Product Management
- Product-specific discount targeting
- Category and collection-based discounts
- Dynamic pricing with discount integration

## Best Practices

### Discount Design
1. **Clear Naming**: Descriptive discount names and codes
2. **Logical Priority**: Consistent priority numbering
3. **Reasonable Limits**: Appropriate usage limits and time bounds
4. **Target Precision**: Specific targeting to avoid unintended applications

### Business Rules
1. **Stacking Logic**: Clear rules for discount combinations
2. **Minimum Requirements**: Appropriate cart/order minimums
3. **Exclusion Rules**: Prevent conflicting discount applications
4. **Communication**: Clear discount terms for customers

### Technical Implementation
1. **Validation**: Comprehensive input validation
2. **Testing**: Thorough testing of edge cases
3. **Monitoring**: Track discount performance and errors
4. **Maintenance**: Regular cleanup of expired discounts
