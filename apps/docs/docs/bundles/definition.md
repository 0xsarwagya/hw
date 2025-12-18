# Bundle Definition

Bundles enable complex product offerings where customers can choose from multiple options within predefined choice sets. This system supports product bundling, customization, and flexible pricing strategies.

## Bundle Architecture

### Core Components
- **Bundles**: Top-level product groupings with metadata
- **Choice Sets**: Groups of products customers can choose from
- **Set Items**: Individual products within choice sets
- **Bundle Pricing**: Dynamic pricing based on selections

### Bundle Structure
```typescript
interface Bundle {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  allowMixAndMatch: boolean;  // Allow items from multiple sets
  choiceSets: ChoiceSet[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChoiceSet {
  id: string;
  bundleId: string;
  title: string;
  description?: string;
  minQuantity: number;        // Minimum items to select
  maxQuantity: number;        // Maximum items to select
  sortOrder: number;          // Display order
  items: SetItem[];
}

interface SetItem {
  id: string;
  setId: string;
  variantId: string;          // Product variant reference
  sortOrder: number;          // Display order within set
  variant: ProductVariant;    // Hydrated variant data
}
```

## Bundle Types

### Fixed Bundles
- Customer must select exactly the specified quantities
- All choice sets must be satisfied
- Predictable pricing and inventory

### Flexible Bundles
- Customer can choose within quantity ranges
- Mix-and-match across choice sets (optional)
- Dynamic pricing based on selections

## Choice Set Configuration

### Quantity Constraints
```typescript
// Example: Choose 2-3 items from this category
{
  minQuantity: 2,
  maxQuantity: 3,
  title: "Select Main Courses",
  description: "Choose 2-3 main dishes"
}
```

### Validation Rules
- `minQuantity ≤ maxQuantity`
- `maxQuantity ≤ 15` (technical limit)
- `minQuantity ≥ 0`
- `maxQuantity ≥ 1`

## Bundle Creation Process

### 1. Create Bundle
```typescript
POST /admin/bundles
{
  "title": "Custom Pizza Bundle",
  "description": "Build your perfect pizza meal",
  "isActive": true,
  "allowMixAndMatch": false
}
```

### 2. Add Choice Sets
```typescript
POST /admin/bundles/{bundleId}/sets
{
  "title": "Choose Your Pizza",
  "description": "Select your base pizza",
  "minQuantity": 1,
  "maxQuantity": 1
}
```

### 3. Add Set Items
```typescript
POST /admin/bundles/{bundleId}/sets/{setId}/items
{
  "variantIds": ["variant-1", "variant-2", "variant-3"]
}
```

## Bundle Validation

### Business Rules
- **Active Status**: Only active bundles available for purchase
- **Complete Sets**: All choice sets must have items
- **Valid References**: All variant IDs must exist
- **Quantity Limits**: Respect min/max constraints per set

### Technical Validation
- **Set Limits**: Maximum 15 choice sets per bundle
- **Item Limits**: Maximum 50 items per choice set
- **Depth Limits**: Prevent circular references
- **Data Integrity**: Foreign key constraints maintained

## Bundle Pricing Strategy

### Base Pricing
- Individual variant prices maintained
- Bundle pricing calculated from selections
- Discounts can be applied at bundle level

### Dynamic Pricing
```typescript
function calculateBundlePrice(selections: SelectedItems[]): number {
  const basePrice = selections.reduce((sum, item) =>
    sum + item.variant.price, 0
  );

  // Apply bundle-level discounts if configured
  return applyBundleDiscounts(basePrice, bundle.discountRules);
}
```

## Cart Integration

### Bundle Addition
```typescript
POST /storefront/cart/bundle
{
  "bundleId": "bundle-123",
  "selections": {
    "set-1": ["variant-a"],      // Pizza choice
    "set-2": ["variant-x", "variant-y"]  // Sides
  }
}
```

### Selection Validation
- **Set Completeness**: All required sets must have selections
- **Quantity Compliance**: Min/max quantities respected
- **Variant Availability**: Selected variants must be in stock
- **Bundle Consistency**: Selections match bundle definition

## Inventory Management

### Bundle Inventory Logic
- **Individual Tracking**: Each variant maintains separate inventory
- **Bundle Availability**: Bundle available if all required variants available
- **Reservation Strategy**: Individual variant reservations during checkout

### Stock Validation
```typescript
function validateBundleStock(bundleId: string, selections: SelectedItems[]): boolean {
  return selections.every(selection =>
    selection.variant.inventory >= selection.quantity
  );
}
```

## Caching Strategy

### Redis Cache Structure
```
bundle:definition:{bundleId} → BundleDefinition
bundle:availability:{bundleId} → boolean
bundle:price:{bundleId}:{selectionHash} → number
```

### Cache Invalidation
- **Definition Changes**: Update bundle structure
- **Variant Changes**: Update pricing and availability
- **Inventory Changes**: Update availability flags

## Performance Optimization

### Hydration Strategy
- **Lazy Loading**: Bundle data loaded on demand
- **Partial Hydration**: Only load required variant data
- **Cache Warming**: Pre-load popular bundles

### Query Optimization
- **Indexed Fields**: bundle_id, variant_id, sort_order
- **Batch Operations**: Bulk variant loading
- **Connection Pooling**: Efficient Redis connections

## API Endpoints

### Bundle Management
```http
# Create bundle
POST /admin/bundles

# List bundles
GET /admin/bundles?page=1&limit=20

# Get bundle details
GET /admin/bundles/{id}

# Update bundle
PATCH /admin/bundles/{id}

# Delete bundle
DELETE /admin/bundles/{id}
```

### Choice Set Management
```http
# Add choice set
POST /admin/bundles/{bundleId}/sets

# Update choice set
PATCH /admin/bundles/{bundleId}/sets/{setId}

# Delete choice set
DELETE /admin/bundles/{bundleId}/sets/{setId}

# Reorder sets
POST /admin/bundles/{bundleId}/sets/reorder
```

### Set Item Management
```http
# Add items to set
POST /admin/bundles/{bundleId}/sets/{setId}/items

# Remove item from set
DELETE /admin/bundles/{bundleId}/sets/{setId}/items/{itemId}

# Reorder items
POST /admin/bundles/{bundleId}/sets/{setId}/items/reorder
```

### Storefront Integration
```http
# Get bundle for display
GET /storefront/bundles/{id}

# Validate bundle selections
POST /storefront/bundles/{id}/validate

# Get bundle pricing
POST /storefront/bundles/{id}/pricing
```

## Business Logic

### Bundle Lifecycle
1. **Draft**: Bundle being configured (inactive)
2. **Active**: Available for customer purchase
3. **Archived**: Retired but maintain historical data

### Selection Rules
- **Required Sets**: Customer must make selections for all sets
- **Optional Sets**: Some sets can be skipped
- **Quantity Ranges**: Flexible selection within bounds
- **Dependency Rules**: Some choices may restrict others

### Pricing Rules
- **Fixed Pricing**: Bundle has predetermined price
- **Dynamic Pricing**: Price based on selected items
- **Discount Integration**: Bundle-level discounts applied
- **Tax Calculation**: GST applied to final bundle price

## Error Handling

### Validation Errors
```typescript
// Insufficient selections
throw new BadRequestException(
  "Choice set 'Main Course' requires at least 2 selections"
);

// Invalid variant
throw new NotFoundException(
  "Variant not found in bundle choice set"
);

// Out of stock
throw new BadRequestException(
  "Selected variant is out of stock"
);
```

### Recovery Strategies
- **Cache Failures**: Graceful fallback to database
- **Inventory Conflicts**: Automatic retry with updated stock
- **Partial Failures**: Rollback incomplete operations

## Monitoring & Analytics

### Usage Metrics
- **Bundle Popularity**: Most selected bundles
- **Conversion Rates**: Bundle to purchase completion
- **Selection Patterns**: Common choice combinations
- **Abandonment Rates**: Incomplete bundle configurations

### Performance Metrics
- **Load Times**: Bundle data retrieval performance
- **Cache Hit Rates**: Redis cache effectiveness
- **Validation Times**: Selection validation performance

## Best Practices

### Bundle Design
1. **Clear Structure**: Logical choice set organization
2. **Reasonable Limits**: Not too many options to overwhelm
3. **Value Proposition**: Clear benefits over individual purchases
4. **Mobile Friendly**: Easy selection on mobile devices

### Technical Implementation
1. **Cache Strategy**: Appropriate caching for performance
2. **Validation Logic**: Comprehensive selection validation
3. **Error Handling**: Graceful failure recovery
4. **Monitoring**: Track usage and performance

### Business Operations
1. **Inventory Sync**: Regular inventory updates
2. **Price Updates**: Timely pricing adjustments
3. **Bundle Maintenance**: Regular review and updates
4. **Customer Support**: Clear bundle selection guidance
