# Collections

Collections provide a way to group products for marketing, navigation, and discount targeting. Unlike categories which are hierarchical, collections are flat groupings that can contain products from multiple categories.

## Collection Schema

```typescript
interface Collection {
  id: string;                    // UUID primary key
  name: string;                  // Display name
  slug: string;                  // URL-friendly identifier (unique)
  description?: string;          // Optional description
  imageUrl?: string;             // Cover image URL
  createdAt: Date;
  updatedAt: Date;
}
```

## Collection-Product Relationship

Collections have a many-to-many relationship with products through a junction table:

```typescript
interface ProductCollection {
  id: string;                    // UUID primary key
  productId: string;             // Reference to product
  collectionId: string;          // Reference to collection
  createdAt: Date;
}
```

## Slug Management

### Automatic Slug Generation
- Generated from collection name
- Converted to lowercase
- Special characters removed
- Spaces converted to hyphens
- Unique constraint enforced

```typescript
// Examples:
// "Summer Collection" → "summer-collection"
// "New Arrivals 2025" → "new-arrivals-2025"
// "Premium Items" → "premium-items"
```

### Slug Uniqueness
- Automatic conflict resolution with numeric suffixes
- Manual slug validation
- URL-safe characters only

## Collection Features

### Product Assignment
- Products can belong to multiple collections
- Collections can contain products from different categories
- Flexible grouping for marketing campaigns

### Image Management
- Optional cover image for visual representation
- Stored via storage service
- Public URL generation for frontend display

## Integration Points

### Discount Engine
Collections are used as discount targets:

- Standard discounts can apply to specific collections
- Buy/Get discounts can reference collections
- Collection-based pricing rules

### Storefront Display
- Collection-based product browsing
- Featured collections on homepage
- Seasonal or promotional groupings

### Navigation
- Collection-based menu structure
- Product discovery by collection
- Search filtering by collection

## Database Relationships

### Foreign Key Constraints
- `ProductCollection.productId` → `Product.id` (CASCADE)
- `ProductCollection.collectionId` → `Collection.id` (CASCADE)
- Automatic cleanup on product/collection deletion

### Indexes
- `Collection.slug` unique index for URL lookups
- `ProductCollection.productId` index for product queries
- `ProductCollection.collectionId` index for collection queries
- Composite unique index on `(productId, collectionId)`

## API Design (Planned)

### Collection Management
```http
# Create collection
POST /admin/collections
{
  "name": "Summer Sale",
  "description": "Hot summer deals",
  "imageUrl": "https://..."
}

# Add products to collection
POST /admin/collections/{collectionId}/products
{
  "productIds": ["product-1", "product-2"]
}

# Remove product from collection
DELETE /admin/collections/{collectionId}/products/{productId}
```

### Storefront Access
```http
# Get collection details
GET /storefront/collections/{slug}

# Get collection products
GET /storefront/collections/{slug}/products?page=1&limit=20

# List all collections
GET /storefront/collections
```

## Business Logic

### Collection Lifecycle
- Collections can be created, updated, and deleted
- Products can be added/removed from collections
- No restrictions on collection size or composition

### Data Integrity
- Product deletion removes from all collections
- Collection deletion removes all product associations
- Slug uniqueness maintained across all collections

### Performance Considerations
- Efficient product-to-collection lookups
- Cached collection data in Redis
- Optimized queries for storefront display

## Future Enhancements

### Advanced Features
- Collection hierarchies (nested collections)
- Collection-based analytics
- Automated collection rules
- Smart collection recommendations

### Integration Extensions
- Collection-based shipping rules
- Collection-specific pricing
- Collection-based inventory management

## Migration Notes

Collections are currently defined in the database schema but the full API implementation is pending. The discount engine already supports collection-based targeting, indicating planned integration with the collection system.

The collection system will provide flexible product grouping capabilities beyond the hierarchical category structure, enabling sophisticated marketing and merchandising strategies.
