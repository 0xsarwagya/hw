# Product Variants

Product variants extend the base product with specific attributes like size, color, price variations, and inventory tracking. Variants enable selling multiple variations of the same product while maintaining a unified product identity.

## Variant Schema

```typescript
interface ProductVariant {
  id: string;                    // UUID primary key
  productId: string;             // Reference to parent product
  sku: string;                   // Unique Stock Keeping Unit
  price: number;                 // Variant-specific price in INR
  compareAtPrice?: number;       // Original price for discount display
  currency: string;              // Currency code (default: INR)
  salePrice?: number;            // Active sale price override
  saleStartDate?: Date;          // Scheduled sale start
  saleEndDate?: Date;            // Scheduled sale end
  inventory: number;             // Available quantity
  size?: string;                 // Size attribute (S, M, L, etc.)
  color?: string;                // Color attribute
  weight?: number;               // Weight in kg for shipping
  createdAt: Date;
  updatedAt: Date;
}
```

## SKU Management

### Automatic SKU Generation
SKUs are automatically generated from product title and variant attributes:

- Base: First 8 alphanumeric characters of product title (uppercase)
- Size: First 4 alphanumeric characters of size (if provided)
- Color: First 4 alphanumeric characters of color (if provided)
- Format: `PRODUCT-SIZE-COLOR` or `PRODUCT-001`, `PRODUCT-002` for conflicts

```typescript
// Examples:
// "Wireless Bluetooth Headphones" + "Small" + "Red" → "WIRELESS-SM-RE"
// "Premium T-Shirt" + "Large" + "Blue" → "PREMIUMT-LARG-BLUE"
// "Coffee Mug" (no variants) → "COFFEEMU"
```

### Manual SKU Assignment
Custom SKUs can be provided, but must be unique across all variants.

## Pricing Strategy

### Variant Price Override
Variants can have different prices from the base product:

- `price`: Variant-specific price (required)
- `compareAtPrice`: Original price for discount calculation
- `salePrice`: Active sale price (temporary override)

### Sale Scheduling
Variants support scheduled sales:

- `saleStartDate`: When the sale becomes active
- `saleEndDate`: When the sale expires
- Sale prices automatically activate/deactivate based on current time

### Price Resolution Logic
```typescript
function getEffectivePrice(variant: ProductVariant): number {
  const now = new Date();

  // Check for active scheduled sale
  if (variant.salePrice &&
      variant.saleStartDate && variant.saleEndDate &&
      now >= variant.saleStartDate && now <= variant.saleEndDate) {
    return variant.salePrice;
  }

  // Use variant price as default
  return variant.price;
}
```

## Inventory Management

### Inventory Tracking
- `inventory`: Available quantity (integer, >= 0)
- Separate inventory per variant
- Atomic inventory reservations during checkout

### Inventory Operations
- **Reservation**: Temporarily hold inventory during checkout
- **Commit**: Convert reservation to consumed inventory on order completion
- **Release**: Return inventory to available pool on cart abandonment

## Variant Attributes

### Size Attribute
- Optional field for clothing, shoes, etc.
- Maximum 50 characters
- Used in SKU generation and filtering

### Color Attribute
- Optional field for color variations
- Maximum 50 characters
- Used in SKU generation and filtering

### Weight Attribute
- Optional field for shipping calculations
- Stored in kilograms
- Used for shipping cost estimation

## API Endpoints

### Create Variant
```http
POST /admin/products/{productId}/variants
Content-Type: application/json

{
  "price": 2999.99,
  "inventory": 50,
  "size": "Small",
  "color": "Red",
  "weight": 0.5,
  "compareAtPrice": 3499.99
}
```

### List Product Variants
```http
GET /admin/products/{productId}/variants
```

### Update Variant
```http
PATCH /admin/products/{productId}/variants/{variantId}
Content-Type: application/json

{
  "price": 2799.99,
  "inventory": 25,
  "salePrice": 2499.99,
  "saleStartDate": "2025-01-01T00:00:00.000Z",
  "saleEndDate": "2025-01-31T23:59:59.999Z"
}
```

### Delete Variant
```http
DELETE /admin/products/{productId}/variants/{variantId}
```

### Get Variant by SKU
```http
GET /storefront/variants/sku/{sku}
```

## Business Logic

### Variant Creation
- Must reference existing product
- SKU automatically generated if not provided
- Inventory defaults to 0
- Currency defaults to INR

### SKU Uniqueness
- SKUs must be unique across all variants
- Automatic conflict resolution with counter suffixes
- Manual SKUs validated for uniqueness

### Price Validation
- Price must be >= 0
- Sale price must be >= 0 (if provided)
- Compare-at price must be >= 0 (if provided)
- Sale price should typically be < regular price

### Sale Scheduling
- Sale dates are optional
- Sale only active when both start and end dates are set
- Current time must be within sale window
- Sale price takes precedence over regular price

### Inventory Constraints
- Inventory cannot be negative
- Reservations cannot exceed available inventory
- Atomic operations prevent race conditions

## Database Relationships

### Foreign Key Constraints
- `productId` references `products.id` (CASCADE on delete)
- Variant deletion when parent product is deleted
- Maintains referential integrity

### Indexes
- `productId` index for product-specific queries
- `sku` index for SKU lookups and uniqueness
- Composite indexes for common query patterns

## Integration Points

### Cart System
- Variants added to cart with specific attributes
- Inventory reservations during cart operations
- Price calculations based on variant pricing

### Order System
- Variants committed to orders
- Inventory consumption on order completion
- Historical price tracking

### Pricing Engine
- Variant-specific pricing rules
- Scheduled sale support
- Customer group pricing (future)

### Inventory System
- Variant-level inventory tracking
- Reservation management
- Low stock notifications

## Performance Considerations

### Database Optimization
- Indexed on frequently queried fields
- Efficient SKU uniqueness checks
- Optimized variant listing queries

### Caching Strategy
- Variant details cached in Redis
- Price information cached with TTL
- Inventory levels cached for performance

### Query Optimization
- Batched variant operations
- Efficient inventory updates
- Minimal database round trips
