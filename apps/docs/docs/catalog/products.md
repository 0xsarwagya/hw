# Products

The products catalog is the core of the ecommerce system, providing comprehensive product management with features like GST calculation, category organization, image management, and advanced search capabilities.

## Product Schema

```typescript
interface Product {
  id: string;                    // UUID primary key
  title: string;                 // Product name (max 255 chars)
  description?: string;          // Detailed description (max 5000 chars)
  price: number;                 // Base price in INR
  gstRate: number;               // GST percentage (0, 5, 12, 18, 28)
  hsnCode?: string;              // HSN code for tax classification
  status: 'draft' | 'active' | 'archived';  // Product lifecycle status
  categoryId?: string;           // Optional category association
  createdAt: Date;
  updatedAt: Date;
}
```

## Product Status

- **draft**: Product is being created, not visible to customers
- **active**: Product is live and available for purchase
- **archived**: Product is retired but kept for historical orders

## GST Integration

Products support Indian GST rates with automatic tax calculations:

- Valid GST rates: 0%, 5%, 12%, 18%, 28%
- HSN codes for proper tax classification
- Automatic price calculations including GST

```typescript
// Example GST calculation
const basePrice = 1000;
const gstRate = 18; // 18%
const gstAmount = (basePrice * gstRate) / 100; // = 180
const totalPrice = basePrice + gstAmount; // = 1180
```

## Category Association

Products can be associated with categories for organization:

- Optional category relationship
- Categories are hierarchical
- Products can exist without categories
- Category deletion sets product.categoryId to null

## Product Images

Products support multiple images with the following features:

- Primary image selection
- Image upload via storage service
- Automatic thumbnail generation
- Public URL generation for frontend display

## Search and Filtering

Advanced product search with multiple strategies:

### Full-Text Search
- Fuzzy matching on title and description
- Relevance scoring
- SKU detection for exact matches

### Filtering Options
- Price range filtering
- Category filtering
- Status filtering
- GST rate filtering

### Sorting Options
- Price (ascending/descending)
- Title (alphabetical)
- Creation date
- Relevance score (for search results)

## API Endpoints

### Create Product
```http
POST /admin/products
Content-Type: application/json

{
  "title": "Wireless Bluetooth Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": 2999.99,
  "gstRate": 18,
  "hsnCode": "8518.12.00",
  "status": "draft",
  "categoryId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### List Products
```http
GET /admin/products?page=1&limit=20&status=active&categoryId=123
```

### Search Products
```http
GET /storefront/products/search?q=headphones&sortBy=relevance&sortOrder=desc
```

### Update Product
```http
PATCH /admin/products/{id}
Content-Type: application/json

{
  "title": "Premium Wireless Bluetooth Headphones",
  "price": 3499.99,
  "status": "active"
}
```

### Delete Product
```http
DELETE /admin/products/{id}
```

## Product Images API

### Upload Product Image
```http
POST /admin/products/{productId}/images
Content-Type: multipart/form-data

image: <file>
isPrimary: true
```

### List Product Images
```http
GET /admin/products/{productId}/images
```

### Delete Product Image
```http
DELETE /admin/products/{productId}/images/{imageId}
```

## Validation Rules

### Title
- Required field
- Maximum 255 characters
- Must be non-empty string

### Description
- Optional field
- Maximum 5000 characters
- Can be null/undefined

### Price
- Required field
- Must be a positive number (>= 0)
- Decimal precision supported

### GST Rate
- Optional field (defaults to 0)
- Must be one of: 0, 5, 12, 18, 28
- Affects tax calculations

### HSN Code
- Optional field
- Maximum 50 characters
- Used for tax compliance

### Category ID
- Optional field
- Must be valid UUID if provided
- References existing category

## Business Logic

### Status Transitions
- Products can transition between any status
- No restrictions on status changes
- Archived products remain accessible for order history

### Price Updates
- Price changes affect new orders only
- Existing orders maintain original pricing
- GST calculations update automatically with price changes

### Category Changes
- Category can be changed at any time
- Null category association allowed
- Category deletion doesn't affect products

### Deletion Constraints
- Products cannot be deleted if referenced by orders
- Use archive status instead for retired products
- Maintains data integrity

## Performance Considerations

### Database Indexes
- Category ID index for category filtering
- Status index for status filtering
- HSN code index for tax reporting

### Search Optimization
- Fuse.js for fuzzy text search
- Relevance scoring for search results
- Pagination for large result sets

### Caching Strategy
- Product details cached in Redis
- Search results cached with TTL
- Image URLs pre-generated for performance
