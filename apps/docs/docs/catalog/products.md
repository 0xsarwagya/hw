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

Products support comprehensive media management with the following features:

### Product-Level Images
- **Multiple Images**: Up to 15 images per product
- **Primary Image**: First image (order = 0) is marked as featured
- **Image Ordering**: Drag-and-drop reordering with automatic order management
- **Alt Text**: Accessibility support with editable alt text
- **Image Replacement**: Replace existing images without losing order
- **Automatic Compression**: Server-side image compression using Sharp (WebP/JPEG/PNG)
- **Storage Integration**: S3/Minio/Supabase storage with presigned URLs

### Variant-Level Images
- **Variant Images**: Up to 10 images per variant
- **Image Inheritance**: Variants can inherit product images or use custom images
- **Toggle Support**: Switch between product images and variant-specific images
- **Separate Management**: Variant images managed independently from product images

### Image Management Features
- **Drag-and-Drop Upload**: Multiple file selection with progress indicators
- **Visual Reordering**: Drag-and-drop interface for image ordering
- **Image Inspector**: Right-side panel for editing alt text, replacing images, and viewing metadata
- **Media Gallery**: Grouped display showing featured, additional, and variant images
- **Rate Limiting**: Upload endpoints protected with ADMIN_MUTATE rate limits
- **Validation**: File size (10MB max), MIME type validation (JPEG, PNG, WebP, GIF)

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

### List Product Images
```http
GET /products/{productId}/images
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "productId": "123e4567-e89b-12d3-a456-426614174001",
    "variantId": null,
    "url": "https://storage.example.com/products/image.webp",
    "altText": "Product image description",
    "order": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### Upload Product Image
```http
POST /products/{productId}/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageKey": "products/20241216-abc123.webp",
  "altText": "Product image description",
  "order": 0,
  "variantId": "optional-variant-id"
}
```

**Note**: Images must be uploaded to storage first using `/admin/storage/upload`, then the returned key is used here.

### Update Image (Alt Text/Order)
```http
PATCH /products/images/{imageId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "altText": "Updated alt text",
  "order": 1
}
```

### Replace Image
```http
PUT /products/images/{imageId}/replace
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageKey": "products/20241216-new-image.webp"
}
```

### Update Image Order
```http
PUT /products/images/{imageId}/order
Content-Type: application/json
Authorization: Bearer <token>

{
  "order": 2
}
```

### Delete Product Image
```http
DELETE /products/images/{imageId}
Authorization: Bearer <token>
```

### Get Variant Images
```http
GET /products/{productId}/variants/{variantId}/images
Authorization: Bearer <token>
```

### Image Constraints
- **Product Images**: Maximum 15 images per product
- **Variant Images**: Maximum 10 images per variant
- **File Size**: Maximum 10MB per image
- **Formats**: JPEG, PNG, WebP, GIF
- **Auto-Ordering**: If order not specified, automatically increments from highest existing order

## Media Consistency Engine

The media consistency engine ensures data integrity and handles race conditions in product media management. It provides automated validation, consistency checks, and repair mechanisms.

### Features

- **Invariant Checkers**: Validators that detect inconsistencies
- **Auto-Fix Services**: Services that automatically repair issues
- **Audit Logging**: Immutable log of all fixes and issues
- **Admin Tools**: UI and API endpoints for manual intervention
- **Cron Jobs**: Automated nightly maintenance
- **Race Condition Handling**: Transaction-based locking for concurrent operations

### Issue Types

The consistency engine detects and fixes the following issues:

1. **Orphan Images**: Images with invalid productId/variantId references
2. **Order Index Gaps**: Missing or non-sequential order values
3. **Order Index Collisions**: Multiple images with the same order value
4. **S3 Consistency Issues**: Database records without corresponding S3 files
5. **Variant Inheritance Violations**: Variants with incorrect image inheritance

### Media Health API

#### Scan for Issues

```http
GET /admin/media/health/scan
```

Returns all detected issues and health statistics.

**Response:**

```json
{
  "issues": [
    {
      "type": "orphan_image",
      "severity": "error",
      "description": "Image references non-existent product",
      "productId": "...",
      "imageId": "...",
      "suggestedFix": "Delete orphaned image"
    }
  ],
  "stats": {
    "totalProducts": 100,
    "totalImages": 500,
    "orphanImages": 5,
    "orderIndexIssues": 2,
    "s3ConsistencyIssues": 1,
    "totalIssues": 8
  },
  "scannedAt": "2024-01-01T00:00:00Z"
}
```

#### Fix Issues

```http
POST /admin/media/health/fix/{action}
```

Available actions:
- `order` - Fix order index errors
- `orphans` - Remove orphan images
- `inheritance` - Fix variant inheritance
- `s3` - Clean S3 orphans
- `all` - Run all fixes

**Query Parameters:**
- `performedBy` (optional) - User ID or "system" for automated fixes

**Response:**

```json
{
  "fixed": [
    {
      "issueId": "...",
      "issueType": "orphan_image",
      "action": "deleted_orphan_image",
      "success": true
    }
  ],
  "errors": [],
  "stats": {
    "totalIssues": 5,
    "fixedCount": 5,
    "errorCount": 0
  }
}
```

#### Audit Logs

```http
GET /admin/media/health/audit-logs
```

**Query Parameters:**
- `productId` (optional)
- `variantId` (optional)
- `imageId` (optional)
- `action` (optional)
- `limit` (optional)
- `offset` (optional)

### Automated Maintenance

A nightly cron job runs at 3 AM daily to:
- Scan for all media consistency issues
- Auto-fix orphan images
- Auto-fix order drift
- Log all operations to audit logs

### Race Condition Handling

All image operations (add, update, delete, reorder) are wrapped in transactions with row-level locking to prevent race conditions:

- Product images are locked during operations
- Variant images are locked during operations
- Retry logic handles deadlocks and serialization errors
- Cache invalidation ensures UI consistency

### Cache Invalidation

The consistency engine automatically invalidates caches when fixes are applied:
- Product image caches
- Variant image caches
- Product detail caches

### Admin UI

Access the media health dashboard at `/media-health` in the admin panel to:
- View current health statistics
- See all detected issues
- Run manual fixes
- Review audit logs

### Troubleshooting

**Common Issues:**

1. **Orphan Images**: Usually caused by deleted products/variants. Run the orphan cleanup fix.
2. **Order Index Gaps**: Can occur after manual deletions. Run the order fix.
3. **S3 Missing Files**: Database records exist but S3 files are missing. Check S3 storage and run S3 cleanup.

**Best Practices:**

- Run a scan before major media operations
- Review audit logs regularly
- Let automated maintenance handle routine fixes
- Use manual fixes for specific issues only

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
