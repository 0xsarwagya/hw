# Complete Storefront API Routes Documentation

This document provides a comprehensive, detailed explanation of all storefront routes in the ecommerce application. It includes all endpoints, their DTOs (Data Transfer Objects), request/response structures, authentication requirements, and usage examples.

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Product Routes](#product-routes)
3. [Category Routes](#category-routes)
4. [Cart Routes](#cart-routes)
5. [Checkout Routes](#checkout-routes)
6. [Order Routes](#order-routes)
7. [Customer Routes](#customer-routes)
8. [Address Routes](#address-routes)
9. [Review Routes](#review-routes)
10. [Discount Routes](#discount-routes)
11. [Address Autocomplete Routes](#address-autocomplete-routes)
12. [Inventory Routes](#inventory-routes)

---

## Authentication Routes

### Base Path: `/auth`

All authentication routes are public and do not require authentication.

#### 1. Register User

**Endpoint:** `POST /auth/register`

**Description:** Creates a new user account with email and password. Returns access token and refresh token for immediate authentication.

**Request Body (RegisterDto):**
```typescript
{
  email: string;           // Valid email address
  password: string;        // Minimum 8 characters
  role?: string;           // Optional role (defaults to "customer")
}
```

**Response (AuthResponseDto):**
```typescript
{
  access_token: string;     // JWT access token
  refresh_token: string;    // JWT refresh token
}
```

**Status Codes:**
- `201 Created`: User successfully registered
- `400 Bad Request`: Invalid input or user already exists

**Example Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!"
}
```

---

#### 2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user with email and password. Returns JWT access token and refresh token. Tokens are also set as httpOnly cookies for browser-based applications.

**Request Body (LoginDto):**
```typescript
{
  email: string;           // User email address
  password: string;        // User password
}
```

**Response (AuthResponseDto):**
```typescript
{
  access_token: string;     // JWT access token (also set as cookie)
  refresh_token: string;    // JWT refresh token (also set as cookie)
}
```

**Cookies Set:**
- `admin_access_token`: Access token (httpOnly, secure in production, 7 days expiry)
- `admin_refresh_token`: Refresh token (httpOnly, secure in production, 7 days expiry)

**Status Codes:**
- `200 OK`: User successfully authenticated
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid input

**Rate Limiting:** Login attempts are rate-limited to prevent brute force attacks.

---

#### 3. Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Description:** Gets a new access token and refresh token using a valid refresh token. Can read refresh token from cookie or request body.

**Request Body (RefreshTokenDto):**
```typescript
{
  refresh_token?: string;   // Optional if provided in cookie
}
```

**Response (AuthResponseDto):**
```typescript
{
  access_token: string;     // New JWT access token
  refresh_token: string;    // New JWT refresh token
}
```

**Status Codes:**
- `200 OK`: Tokens successfully refreshed
- `401 Unauthorized`: Invalid or expired refresh token

---

#### 4. Logout User

**Endpoint:** `POST /auth/logout`

**Description:** Clears authentication cookies. Does not invalidate tokens server-side (stateless JWT).

**Response:**
```typescript
{
  message: "Logged out successfully"
}
```

**Status Codes:**
- `200 OK`: Successfully logged out

---

#### 5. Get User Profile

**Endpoint:** `GET /auth/profile`

**Description:** Gets the profile of the currently authenticated user. Requires authentication.

**Authentication:** Required (Bearer token)

**Response (UserProfileDto):**
```typescript
{
  id: string;              // User ID
  email: string;           // User email
  role: string;            // User role (e.g., "customer", "admin")
}
```

**Status Codes:**
- `200 OK`: User profile retrieved successfully
- `401 Unauthorized`: Authentication required

---

## Product Routes

### Base Path: `/products`

Product routes provide access to product catalog, search, filtering, and product details.

#### 1. List Products

**Endpoint:** `GET /products`

**Description:** Retrieves a paginated list of products with search, filters, and sorting capabilities. This is a public endpoint that supports full-text search in title, description, and SKU.

**Query Parameters (QueryProductsDto):**
```typescript
{
  page?: number;            // Page number (default: 1, minimum: 1)
  limit?: number;           // Items per page (default: 10, max: 100, minimum: 1)
  search?: string;          // Search query (searches in title, description, SKU)
  status?: "draft" | "active" | "archived";  // Filter by status
  categoryId?: string;      // Filter by category ID (UUID)
  minPrice?: number;        // Minimum price filter in INR (minimum: 0)
  maxPrice?: number;        // Maximum price filter in INR (minimum: 0)
  inStock?: boolean;        // Filter by availability (true = in stock, false = out of stock)
  sortBy?: "price" | "name" | "date";  // Sort field (default: "date")
  sortOrder?: "asc" | "desc";  // Sort order (default: "desc")
}
```

**Response (PaginatedProductsResponseDto):**
```typescript
{
  data: ProductResponseDto[];  // Array of products
  pagination: {
    page: number;              // Current page number
    limit: number;             // Items per page
    total: number;              // Total number of products
    totalPages: number;         // Total number of pages
  }
}
```

**ProductResponseDto Structure:**
```typescript
{
  id: string;                  // Product ID (UUID)
  title: string;               // Product title
  description: string | null;   // Product description
  price: number;               // Product price in INR
  gstRate: number;             // GST rate percentage
  pricingType: "inclusive" | "exclusive";  // Whether price includes/excludes GST
  gstAmount: number;           // Calculated GST amount
  priceExcludingGst: number;   // Price excluding GST
  priceIncludingGst: number;   // Price including GST
  hsnCode: string | null;      // HSN code
  status: "draft" | "active" | "archived";  // Product status
  categoryId: string | null;   // Category ID
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last update timestamp
}
```

**Status Codes:**
- `200 OK`: List of products retrieved successfully

**Rate Limiting:** Storefront GET rate limit applies

**Example Request:**
```
GET /products?page=1&limit=20&search=wireless&status=active&minPrice=1000&maxPrice=5000&sortBy=price&sortOrder=asc
```

---

#### 2. Advanced Product Search

**Endpoint:** `POST /products/search`

**Description:** Performs advanced product search with full-text search, SKU search, fuzzy matching, and relevance ranking. Uses fuse.js for intelligent search matching.

**Request Body (SearchProductsDto):**
```typescript
{
  query: string;              // Search query
  limit?: number;             // Maximum results (default: 10)
  threshold?: number;         // Fuse.js threshold (0.0-1.0, default: 0.6)
}
```

**Response (SearchResponseDto):**
```typescript
{
  results: Array<{
    product: ProductResponseDto;
    score: number;            // Relevance score (0-1, higher is better)
  }>;
  total: number;              // Total matching results
}
```

**Status Codes:**
- `200 OK`: Search results with relevance scores
- `400 Bad Request`: Invalid search query or parameters

**Rate Limiting:** Categories search rate limit applies

---

#### 3. Filter Products

**Endpoint:** `POST /products/filter`

**Description:** Filter products by category, price range, availability, and status. Sort by price, name, or date. All filters can be combined.

**Request Body (FilterProductsDto):**
```typescript
{
  categoryId?: string;        // Filter by category ID
  minPrice?: number;          // Minimum price (INR)
  maxPrice?: number;          // Maximum price (INR)
  inStock?: boolean;          // Filter by stock availability
  status?: "draft" | "active" | "archived";  // Filter by status
  sortBy?: "price" | "name" | "date";  // Sort field
  sortOrder?: "asc" | "desc";  // Sort order
  page?: number;              // Page number
  limit?: number;             // Items per page
}
```

**Response (PaginatedProductsResponseDto):** Same as List Products

**Status Codes:**
- `200 OK`: Filtered and sorted products
- `400 Bad Request`: Invalid filter parameters

**Rate Limiting:** Categories search rate limit applies

---

#### 4. Get Product by ID

**Endpoint:** `GET /products/:id`

**Description:** Retrieves a single product by its ID. This is a public endpoint.

**Path Parameters:**
- `id`: Product ID (UUID)

**Response (ProductResponseDto):** Same structure as in List Products

**Status Codes:**
- `200 OK`: Product retrieved successfully
- `404 Not Found`: Product not found

**Rate Limiting:** Product detail rate limit applies

**Example Request:**
```
GET /products/123e4567-e89b-12d3-a456-426614174000
```

---

#### 5. Get Product Reviews

**Endpoint:** `GET /products/:id/reviews`

**Description:** Retrieves paginated reviews for a product variant. Supports filtering and sorting. Public endpoint.

**Path Parameters:**
- `id`: Product variant ID (UUID)

**Query Parameters (ReviewQueryDto):**
```typescript
{
  page?: number;              // Page number (default: 1)
  limit?: number;             // Items per page (default: 10)
  rating?: number;            // Filter by rating (1-5)
  sortBy?: "date" | "rating" | "helpful";  // Sort field
  sortOrder?: "asc" | "desc";  // Sort order
}
```

**Response (ReviewResponseDto[]):**
```typescript
{
  id: string;                 // Review ID
  variantId: string;          // Product variant ID
  customerId: string;         // Customer ID
  rating: number;             // Rating (1-5)
  title?: string;             // Review title
  comment?: string;           // Review comment
  helpful: number;            // Number of helpful votes
  isVerifiedPurchase: boolean; // Whether from verified purchase
  createdAt: Date;            // Creation timestamp
  updatedAt: Date;            // Last update timestamp
  customer?: {                // Customer info (if public)
    name: string;
    email: string;
  };
}
```

**Status Codes:**
- `200 OK`: Reviews retrieved successfully

**Rate Limiting:** Reviews listing rate limit applies

---

#### 6. Get Review Aggregate

**Endpoint:** `GET /products/:id/reviews/aggregate`

**Description:** Gets aggregated review statistics (average rating, counts) for a product variant. Uses Redis cache for performance. Public endpoint.

**Path Parameters:**
- `id`: Product variant ID (UUID)

**Response (ReviewAggregateDto):**
```typescript
{
  variantId: string;          // Product variant ID
  averageRating: number;      // Average rating (0-5)
  reviewCount: number;         // Total number of reviews
  rating1Count: number;       // Count of 1-star reviews
  rating2Count: number;       // Count of 2-star reviews
  rating3Count: number;       // Count of 3-star reviews
  rating4Count: number;       // Count of 4-star reviews
  rating5Count: number;       // Count of 5-star reviews
  updatedAt: Date;            // Last update timestamp
}
```

**Status Codes:**
- `200 OK`: Review aggregate retrieved successfully
- `404 Not Found`: No reviews found for this variant

**Rate Limiting:** Reviews listing rate limit applies

---

#### 7. Create Review

**Endpoint:** `POST /products/:id/reviews`

**Description:** Creates a review for a product variant. Requires verified purchase (order must be delivered). Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id`: Product variant ID (UUID)

**Request Body (CreateReviewDto):**
```typescript
{
  rating: number;             // Rating (1-5, required)
  title?: string;             // Review title (optional)
  comment?: string;           // Review comment (optional)
  variantId: string;         // Overridden from path parameter
}
```

**Response (ReviewResponseDto):** Same structure as Get Product Reviews

**Status Codes:**
- `201 Created`: Review created successfully
- `400 Bad Request`: Invalid request (e.g., order not delivered, already reviewed)
- `401 Unauthorized`: Authentication required

---

#### 8. Get Single Review

**Endpoint:** `GET /products/reviews/:reviewId`

**Description:** Gets a single review by its ID. Public endpoint.

**Path Parameters:**
- `reviewId`: Review ID (UUID)

**Response (ReviewResponseDto):** Same structure as Get Product Reviews

**Status Codes:**
- `200 OK`: Review retrieved successfully
- `404 Not Found`: Review not found

---

#### 9. Update Review

**Endpoint:** `PATCH /products/reviews/:reviewId`

**Description:** Updates your own review. Only allowed within 30 days of creation and if not rejected. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `reviewId`: Review ID (UUID)

**Request Body (UpdateReviewDto):**
```typescript
{
  rating?: number;            // Updated rating (1-5)
  title?: string;             // Updated title
  comment?: string;           // Updated comment
}
```

**Response (ReviewResponseDto):** Same structure as Get Product Reviews

**Status Codes:**
- `200 OK`: Review updated successfully
- `403 Forbidden`: You can only edit your own reviews
- `400 Bad Request`: Cannot edit (rejected or time limit exceeded)
- `401 Unauthorized`: Authentication required

---

#### 10. Delete Review

**Endpoint:** `DELETE /products/reviews/:reviewId`

**Description:** Deletes your own review. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `reviewId`: Review ID (UUID)

**Status Codes:**
- `204 No Content`: Review deleted successfully
- `403 Forbidden`: You can only delete your own reviews
- `401 Unauthorized`: Authentication required

---

#### 11. Mark Review as Helpful

**Endpoint:** `POST /products/reviews/:reviewId/helpful`

**Description:** Marks a review as helpful (idempotent). Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `reviewId`: Review ID (UUID)

**Response:**
```typescript
{
  helpful: boolean;            // Whether review is marked as helpful
}
```

**Status Codes:**
- `200 OK`: Review marked as helpful
- `401 Unauthorized`: Authentication required

---

#### 12. Remove Helpful Vote

**Endpoint:** `DELETE /products/reviews/:reviewId/helpful`

**Description:** Removes your helpful vote from a review. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `reviewId`: Review ID (UUID)

**Response:**
```typescript
{
  helpful: boolean;            // Whether review is still marked as helpful
}
```

**Status Codes:**
- `200 OK`: Helpful vote removed
- `401 Unauthorized`: Authentication required

---

## Category Routes

### Base Path: `/categories`

Category routes provide access to product categories and their hierarchical structure.

#### 1. List All Categories

**Endpoint:** `GET /categories`

**Description:** Retrieves a list of all categories. This is a public endpoint.

**Response (CategoryResponseDto[]):**
```typescript
[
  {
    id: string;               // Category ID (UUID)
    name: string;              // Category name
    slug: string;              // URL-friendly slug
    description: string | null; // Category description
    parentId: string | null;   // Parent category ID (for hierarchy)
    imageUrl: string | null;   // Category image URL
    order: number;             // Display order
    createdAt: Date;           // Creation timestamp
    updatedAt: Date;           // Last update timestamp
  }
]
```

**Status Codes:**
- `200 OK`: List of categories retrieved successfully

**Rate Limiting:** Categories search rate limit applies

---

#### 2. Get Category Tree

**Endpoint:** `GET /categories/tree`

**Description:** Retrieves categories in hierarchical tree structure. Useful for navigation menus. Public endpoint.

**Response (CategoryTreeDto[]):**
```typescript
[
  {
    id: string;               // Category ID
    name: string;             // Category name
    slug: string;             // Category slug
    description: string | null;
    parentId: string | null;
    imageUrl: string | null;
    order: number;
    children: CategoryTreeDto[];  // Nested child categories
    createdAt: Date;
    updatedAt: Date;
  }
]
```

**Status Codes:**
- `200 OK`: Category tree retrieved successfully

**Rate Limiting:** Categories search rate limit applies

---

#### 3. Get Category by ID

**Endpoint:** `GET /categories/:id`

**Description:** Retrieves a single category by its ID. Public endpoint.

**Path Parameters:**
- `id`: Category ID (UUID)

**Response (CategoryResponseDto):** Same structure as List All Categories (single object)

**Status Codes:**
- `200 OK`: Category retrieved successfully
- `404 Not Found`: Category not found

**Rate Limiting:** Categories search rate limit applies

---

#### 4. Get Category by Slug

**Endpoint:** `GET /categories/slug/:slug`

**Description:** Retrieves a single category by its slug. Useful for SEO-friendly URLs. Public endpoint.

**Path Parameters:**
- `slug`: Category slug (e.g., "electronics")

**Response (CategoryResponseDto):** Same structure as List All Categories (single object)

**Status Codes:**
- `200 OK`: Category retrieved successfully
- `404 Not Found`: Category not found

**Rate Limiting:** Categories search rate limit applies

**Example Request:**
```
GET /categories/slug/electronics
```

---

## Cart Routes

### Base Path: `/cart`

Cart routes handle shopping cart operations. All routes support both authenticated users and guest sessions (via X-Session-Id header).

#### 1. Get Cart

**Endpoint:** `GET /cart`

**Description:** Gets cart for authenticated customer or guest session. Creates cart if it doesn't exist. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Response (CartResponseDto):**
```typescript
{
  id: string;                 // Cart ID (UUID)
  customerId: string | null;  // Customer ID (null for guest carts)
  sessionId: string | null;   // Session ID (for guest carts)
  subtotal: number;           // Cart subtotal before GST (INR)
  gstAmount: number;          // GST amount (INR)
  discountCode: string | null; // Applied discount code
  discountAmount: number;     // Discount amount (INR)
  gstBreakdown: {
    cgst: number;             // Central GST
    sgst: number;             // State GST
    igst: number;             // Integrated GST
    totalGst: number;         // Total GST
    isIntraState: boolean;    // Whether transaction is intra-state
  };
  total: number;              // Cart total (subtotal + GST - discount)
  items: CartItemResponseDto[];  // Cart items
  expiresAt: Date | null;     // Cart expiration timestamp
  createdAt: Date;            // Creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

**CartItemResponseDto Structure:**
```typescript
{
  id: string;                  // Cart item ID
  type: "variant" | "bundle"; // Item type
  productVariantId: string;   // Product variant ID
  bundleId?: string;         // Bundle ID (only for bundle items)
  selections?: UserBundleSelection;  // Bundle selections (only for bundles)
  quantity: number;           // Quantity
  price: number;              // Price at time of adding to cart
  unitBundlePrice?: number;   // Unit bundle price (only for bundles)
  bundleVariantBreakdown?: Array<{
    variantId: string;
    unitPrice: number;
    quantity: number;
  }>;                         // Bundle variant breakdown
  createdAt: Date;
  updatedAt: Date;
}
```

**Status Codes:**
- `200 OK`: Cart retrieved successfully

**Example Request:**
```
GET /cart
Headers: X-Session-Id: session_abc123
```

---

#### 2. Add Item to Cart

**Endpoint:** `POST /cart/items`

**Description:** Adds a product variant or bundle to cart. Creates cart if it doesn't exist. For authenticated users, uses customer cart. For guests, requires session ID. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Request Body (AddItemDto):**
```typescript
{
  type?: "variant" | "bundle";  // Item type (default: "variant")
  productVariantId?: string;    // Product variant ID (required if type="variant")
  bundleId?: string;            // Bundle ID (required if type="bundle")
  selections?: UserBundleSelection;  // Bundle selections (required if type="bundle")
  quantity: number;             // Quantity (minimum: 1)
}
```

**UserBundleSelection Structure:**
```typescript
{
  [setId: string]: string[];     // Map of set ID to array of variant IDs
}
```

**Response (CartResponseDto):** Same structure as Get Cart

**Status Codes:**
- `201 Created`: Item added to cart successfully
- `400 Bad Request`: Invalid input or insufficient inventory
- `404 Not Found`: Product variant not found

**Rate Limiting:** Cart updates rate limit applies

**Example Request:**
```json
{
  "type": "variant",
  "productVariantId": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 2
}
```

**Example Bundle Request:**
```json
{
  "type": "bundle",
  "bundleId": "123e4567-e89b-12d3-a456-426614174000",
  "selections": {
    "set-1": ["variant-1"],
    "set-2": ["variant-2", "variant-3"]
  },
  "quantity": 1
}
```

---

#### 3. Update Cart Item Quantity

**Endpoint:** `PUT /cart/items/:id`

**Description:** Updates the quantity of an item in the cart. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Path Parameters:**
- `id`: Cart item ID (UUID)

**Request Body (UpdateItemDto):**
```typescript
{
  quantity: number;           // New quantity (minimum: 1)
}
```

**Response (CartResponseDto):** Same structure as Get Cart

**Status Codes:**
- `200 OK`: Cart item updated successfully
- `404 Not Found`: Cart item not found
- `400 Bad Request`: Invalid input or insufficient inventory

**Rate Limiting:** Cart updates rate limit applies

---

#### 4. Remove Item from Cart

**Endpoint:** `DELETE /cart/items/:id`

**Description:** Removes an item from the cart. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Path Parameters:**
- `id`: Cart item ID (UUID)

**Response (CartResponseDto):** Same structure as Get Cart

**Status Codes:**
- `200 OK`: Item removed from cart successfully
- `404 Not Found`: Cart item not found

**Rate Limiting:** Cart updates rate limit applies

---

#### 5. Clear Cart

**Endpoint:** `DELETE /cart`

**Description:** Removes all items from the cart. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Response (CartResponseDto):** Same structure as Get Cart (empty items array)

**Status Codes:**
- `200 OK`: Cart cleared successfully

---

#### 6. Apply Discount Code

**Endpoint:** `POST /cart/discount`

**Description:** Applies a discount code to the cart. Validates the code and recalculates totals. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Request Body (ApplyDiscountDto):**
```typescript
{
  code: string;               // Discount code
}
```

**Response (CartResponseDto):** Same structure as Get Cart (with discount applied)

**Status Codes:**
- `200 OK`: Discount applied successfully
- `400 Bad Request`: Invalid discount code or discount not applicable

**Example Request:**
```json
{
  "code": "SAVE20"
}
```

---

#### 7. Remove Discount Code

**Endpoint:** `DELETE /cart/discount`

**Description:** Removes the applied discount code from the cart and recalculates totals. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest carts (required if not authenticated)

**Response (CartResponseDto):** Same structure as Get Cart (without discount)

**Status Codes:**
- `200 OK`: Discount removed successfully

---

## Checkout Routes

### Base Path: `/store/checkout`

Checkout routes handle payment method selection and checkout flow. All routes are public and support both authenticated and guest checkout.

#### 1. Get Available Payment Methods

**Endpoint:** `GET /store/checkout/payment-methods`

**Description:** Returns all available payment methods with calculated fees based on current cart total. Supports both authenticated and guest checkout. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest checkout (required for guest checkout)

**Query Parameters:**
- `checkoutSessionId` (optional): Checkout session ID

**Response:**
```typescript
{
  methods: PaymentMethodWithFeeDto[];
}
```

**PaymentMethodWithFeeDto Structure:**
```typescript
{
  code: string;              // Payment method code (e.g., "COD", "RAZORPAY")
  name: string;               // Payment method display name
  description?: string;       // Payment method description
  fee: number;                // Fee amount in paise
  feeBreakdown: {
    baseFee: number;          // Base fee
    percentageFee: number;    // Percentage fee
    fixedFee: number;         // Fixed fee
    totalFee: number;         // Total fee
  };
  isAvailable: boolean;       // Whether method is available
  minAmount?: number;         // Minimum order amount (in paise)
  maxAmount?: number;         // Maximum order amount (in paise)
}
```

**Status Codes:**
- `200 OK`: Payment methods retrieved successfully
- `400 Bad Request`: Bad request (empty cart, etc.)

**Rate Limiting:** Storefront GET rate limit applies

**Example Request:**
```
GET /store/checkout/payment-methods?checkoutSessionId=session-123
Headers: X-Session-Id: session_abc123
```

---

#### 2. Select Payment Method

**Endpoint:** `POST /store/checkout/payment`

**Description:** Selects a payment method and calculates the fee. Stores payment method and fee in checkout session for order creation. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest checkout (required for guest checkout)

**Request Body (SelectPaymentMethodDto):**
```typescript
{
  paymentMethod: string;      // Payment method code (e.g., "COD", "RAZORPAY")
  checkoutSessionId?: string; // Checkout session ID (optional)
}
```

**Response:**
```typescript
{
  success: boolean;            // Whether selection was successful
  fee: number;                // Fee amount in paise
  breakdown: PaymentFeeBreakdownDto;  // Fee breakdown details
}
```

**PaymentFeeBreakdownDto Structure:**
```typescript
{
  baseFee: number;            // Base fee
  percentageFee: number;      // Percentage fee
  fixedFee: number;           // Fixed fee
  totalFee: number;           // Total fee
}
```

**Status Codes:**
- `200 OK`: Payment method selected successfully
- `400 Bad Request`: Bad request (invalid method, cart empty, etc.)
- `404 Not Found`: Checkout session not found

**Rate Limiting:** Payment intent rate limit applies

**Example Request:**
```json
{
  "paymentMethod": "COD",
  "checkoutSessionId": "session-123"
}
```

---

## Order Routes

### Base Path: `/orders`

Order routes handle order creation, retrieval, and management. Some routes require authentication.

#### 1. Create Payment Intent (Checkout)

**Endpoint:** `POST /orders`

**Description:** Creates a payment intent for checkout. Supports both authenticated and guest checkout. Orders are created only after payment confirmation via webhook. Returns payment intent and checkout session ID for redirecting to payment gateway. Public endpoint.

**Headers:**
- `X-Session-Id` (optional): Session ID for guest checkout (required for guest checkout)
- `Authorization` (optional): Bearer token for authenticated checkout

**Request Body (CreateOrderDto):**

For Authenticated Users:
```typescript
{
  shippingAddressId: string;   // Shipping address ID (UUID, required)
  billingAddressId: string;    // Billing address ID (UUID, required)
  shippingCost?: number;       // Shipping cost in INR (default: 0)
  idempotencyKey?: string;     // Idempotency key for ensuring idempotent order creation
}
```

For Guest Checkout:
```typescript
{
  email: string;               // Email address (required for guest checkout)
  name: string;                // Customer name (required for guest checkout)
  phone: string;               // Phone number (required for guest checkout)
  address: CreateAddressDto;   // Shipping address (required for guest checkout)
  password?: string;           // Password (optional - if provided, creates account)
  shippingCost?: number;       // Shipping cost in INR (default: 0)
  idempotencyKey?: string;     // Idempotency key
}
```

**CreateAddressDto Structure:**
```typescript
{
  type: "shipping" | "billing";  // Address type
  street: string;                // Street address
  city: string;                  // City
  state: string;                 // State
  pincode: string;               // PIN code (6 digits)
  district: string;              // District
  country: string;               // Country (default: "India")
}
```

**Response (PaymentIntentResponseDto):**
```typescript
{
  paymentIntent: {
    paymentIntentId: string;    // Payment intent ID from provider
    paymentProvider: string;    // Payment provider (e.g., "razorpay")
    status: string;             // Status (e.g., "CREATED")
    amount: number;             // Amount in paise
    currency: string;           // Currency code (e.g., "INR")
    metadata: object;           // Additional metadata
  };
  checkoutSessionId: string;    // Checkout session ID
  message: string;              // Message indicating next steps
}
```

**Status Codes:**
- `201 Created`: Payment intent created successfully
- `400 Bad Request`: Bad request (empty cart, insufficient inventory, etc.)
- `401 Unauthorized`: Unauthorized (for authenticated checkout)
- `404 Not Found`: Addresses not found or do not belong to customer
- `409 Conflict`: Conflict (cart already being checked out, invalid state, etc.)

**Rate Limiting:** Payment intent rate limit applies

**Example Authenticated Request:**
```json
{
  "shippingAddressId": "123e4567-e89b-12d3-a456-426614174000",
  "billingAddressId": "123e4567-e89b-12d3-a456-426614174001",
  "shippingCost": 50.0
}
```

**Example Guest Request:**
```json
{
  "email": "guest@example.com",
  "name": "Guest User",
  "phone": "+919876543210",
  "address": {
    "type": "shipping",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "district": "Mumbai",
    "country": "India"
  },
  "shippingCost": 50.0
}
```

---

#### 2. List Orders

**Endpoint:** `GET /orders`

**Description:** Returns all orders for the authenticated customer. Optionally filter by status. Authentication required.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `status` (optional): Filter orders by status (OrderStatus enum)

**Response (OrderResponseDto[]):**
```typescript
[
  {
    id: string;                 // Order ID (UUID)
    orderNumber: string;        // Human-readable order number
    customerId: string;         // Customer ID
    status: OrderStatus;         // Order status
    paymentStatus: PaymentStatus;  // Payment status
    shippingStatus: ShippingStatus;  // Shipping status
    subtotal: number;           // Subtotal before GST (INR)
    gstAmount: number;          // GST amount (INR)
    discountAmount: number;     // Discount amount (INR)
    shippingCost: number;       // Shipping cost (INR)
    total: number;              // Total amount (INR)
    items: OrderItemResponseDto[];  // Order items
    shippingAddress: AddressResponseDto;  // Shipping address
    billingAddress: AddressResponseDto;   // Billing address
    paymentIntentId?: string;   // Payment intent ID
    paymentProvider?: string;   // Payment provider
    createdAt: Date;            // Creation timestamp
    updatedAt: Date;            // Last update timestamp
  }
]
```

**Status Codes:**
- `200 OK`: List of orders
- `401 Unauthorized`: Unauthorized

**Example Request:**
```
GET /orders?status=confirmed
```

---

#### 3. Get Order by ID

**Endpoint:** `GET /orders/:id`

**Description:** Returns a specific order by ID for the authenticated customer. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id`: Order ID (UUID)

**Response (OrderResponseDto):** Same structure as List Orders (single object)

**Status Codes:**
- `200 OK`: Order details
- `401 Unauthorized`: Unauthorized
- `404 Not Found`: Order not found

---

#### 4. Update Order Status

**Endpoint:** `PATCH /orders/:id/status`

**Description:** Updates the status of an order. Validates status transitions according to order workflow. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id`: Order ID (UUID)

**Request Body (UpdateOrderStatusDto):**
```typescript
{
  status: OrderStatus;          // New order status
  note?: string;                // Optional note for status change
}
```

**Response (OrderResponseDto):** Same structure as List Orders (single object)

**Status Codes:**
- `200 OK`: Order status updated successfully
- `400 Bad Request`: Invalid status transition
- `401 Unauthorized`: Unauthorized
- `404 Not Found`: Order not found

---

#### 5. Get Order Tracking Information

**Endpoint:** `GET /orders/:id/tracking`

**Description:** Returns tracking information for an order including shipment details and tracking numbers. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id`: Order ID (UUID)

**Response (OrderTrackingDto):**
```typescript
{
  orderId: string;              // Order ID
  orderNumber: string;         // Order number
  status: OrderStatus;         // Current order status
  shippingStatus: ShippingStatus;  // Shipping status
  trackingNumber?: string;      // Tracking number
  carrier?: string;            // Shipping carrier
  estimatedDelivery?: Date;    // Estimated delivery date
  shipmentHistory: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    note?: string;
  }>;                          // Shipment history
}
```

**Status Codes:**
- `200 OK`: Order tracking information
- `401 Unauthorized`: Unauthorized
- `404 Not Found`: Order not found

---

#### 6. Get Order Timeline

**Endpoint:** `GET /orders/:id/timeline`

**Description:** Returns a chronological timeline of all events related to the order including status changes, payments, and shipments. Authentication required.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id`: Order ID (UUID)

**Response (OrderTimelineDto):**
```typescript
{
  orderId: string;              // Order ID
  events: Array<{
    type: string;              // Event type (e.g., "status_change", "payment", "shipment")
    title: string;             // Event title
    description?: string;      // Event description
    timestamp: Date;           // Event timestamp
    metadata?: object;         // Additional event metadata
  }>;                          // Chronological list of events
}
```

**Status Codes:**
- `200 OK`: Order timeline
- `401 Unauthorized`: Unauthorized
- `404 Not Found`: Order not found

---

## Customer Routes

### Base Path: `/customers`

Customer routes handle customer registration, profile management, and account operations.

#### 1. Register Customer

**Endpoint:** `POST /customers/register`

**Description:** Creates a new customer account with email, password, name, and phone. Returns access token and refresh token. Public endpoint.

**Request Body (RegisterCustomerDto):**
```typescript
{
  email: string;               // Customer email address (required)
  password: string;            // Customer password (minimum 8 characters, required)
  name: string;                // Customer name (required, max 255 characters)
  phone: string;               // Phone number (10 digits, Indian format, required)
  gstin?: string;              // GSTIN (15 characters, optional, validated format)
}
```

**Response:**
```typescript
{
  access_token: string;        // JWT access token
  refresh_token: string;       // JWT refresh token
  customer: CustomerProfileDto;  // Customer profile
}
```

**CustomerProfileDto Structure:**
```typescript
{
  id: string;                  // Customer ID (UUID)
  userId: string;              // User ID (UUID)
  email: string;               // Email address
  name: string;                // Customer name
  phone: string;               // Phone number
  gstin: string | null;        // GSTIN (if provided)
  isGuest: boolean;            // Whether customer is a guest
  createdAt: Date;            // Creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

**Status Codes:**
- `201 Created`: Customer successfully registered
- `400 Bad Request`: Invalid input, email/phone/GSTIN already exists, or invalid GSTIN format

**Example Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "9876543210",
  "gstin": "27ABCDE1234F1Z5"
}
```

---

#### 2. Get Customer Profile

**Endpoint:** `GET /customers/me`

**Description:** Gets the profile of the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Response (CustomerProfileDto):** Same structure as Register Customer response

**Status Codes:**
- `200 OK`: Customer profile retrieved successfully
- `401 Unauthorized`: Authentication required

---

#### 3. Update Customer Profile

**Endpoint:** `PUT /customers/me`

**Description:** Updates the profile of the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Request Body (UpdateProfileDto):**
```typescript
{
  name?: string;               // Updated name (max 255 characters)
  phone?: string;             // Updated phone number (10 digits, Indian format)
  gstin?: string;             // Updated GSTIN (15 characters, validated format)
}
```

**Response (CustomerProfileDto):** Same structure as Register Customer response

**Status Codes:**
- `200 OK`: Customer profile updated successfully
- `400 Bad Request`: Invalid input, phone/GSTIN already exists, or invalid GSTIN format
- `401 Unauthorized`: Authentication required

---

#### 4. Change Password

**Endpoint:** `POST /customers/change-password`

**Description:** Changes the password of the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Request Body (ChangePasswordDto):**
```typescript
{
  currentPassword: string;     // Current password (required)
  newPassword: string;         // New password (minimum 8 characters, required)
}
```

**Response:**
```typescript
{
  message: "Password changed successfully"
}
```

**Status Codes:**
- `200 OK`: Password changed successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or current password incorrect

---

#### 5. Claim Guest Account

**Endpoint:** `POST /customers/claim`

**Description:** Converts a guest customer account to a regular account by setting a password. Requires email verification token. Public endpoint.

**Request Body (ClaimAccountDto):**
```typescript
{
  email: string;               // Email address (required)
  token: string;              // Email verification token (required)
  newPassword: string;        // New password (minimum 8 characters, required)
}
```

**Response (CustomerProfileDto):** Same structure as Register Customer response

**Status Codes:**
- `200 OK`: Account claimed successfully
- `400 Bad Request`: Invalid input, email not found, or customer is not a guest
- `401 Unauthorized`: Invalid verification token

**Rate Limiting:** Claim account rate limit applies

---

## Address Routes

### Base Path: `/customers/addresses`

Address routes handle customer address management. All routes require authentication.

#### 1. Add Address

**Endpoint:** `POST /customers/addresses`

**Description:** Adds a new address for the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Request Body (CreateAddressDto):**
```typescript
{
  type: "shipping" | "billing";  // Address type (required)
  street: string;                // Street address (required)
  city: string;                  // City (required)
  state: string;                 // State (required)
  pincode: string;               // PIN code (6 digits, required, validated format)
  district: string;              // District (required)
  country?: string;              // Country (default: "India")
}
```

**Response (AddressResponseDto):**
```typescript
{
  id: string;                    // Address ID (UUID)
  customerId: string;            // Customer ID
  type: "shipping" | "billing";  // Address type
  street: string;                // Street address
  city: string;                  // City
  state: string;                 // State
  pincode: string;               // PIN code
  district: string;              // District
  country: string;               // Country
  isDefault: boolean;            // Whether this is the default address
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

**Status Codes:**
- `201 Created`: Address created successfully
- `400 Bad Request`: Invalid input or invalid PIN code format
- `401 Unauthorized`: Authentication required

---

#### 2. List All Addresses

**Endpoint:** `GET /customers/addresses`

**Description:** Gets all addresses for the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Response (AddressResponseDto[]):** Array of addresses with same structure as Add Address

**Status Codes:**
- `200 OK`: List of addresses
- `401 Unauthorized`: Authentication required

---

#### 3. Get Address by ID

**Endpoint:** `GET /customers/addresses/:id`

**Description:** Gets a specific address by ID for the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Path Parameters:**
- `id`: Address ID (UUID)

**Response (AddressResponseDto):** Same structure as Add Address (single object)

**Status Codes:**
- `200 OK`: Address found
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Address not found

---

#### 4. Update Address

**Endpoint:** `PUT /customers/addresses/:id`

**Description:** Updates an existing address by ID for the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Path Parameters:**
- `id`: Address ID (UUID)

**Request Body (UpdateAddressDto):**
```typescript
{
  type?: "shipping" | "billing";  // Updated address type
  street?: string;                // Updated street address
  city?: string;                  // Updated city
  state?: string;                 // Updated state
  pincode?: string;               // Updated PIN code (6 digits, validated)
  district?: string;              // Updated district
  country?: string;              // Updated country
}
```

**Response (AddressResponseDto):** Same structure as Add Address (single object)

**Status Codes:**
- `200 OK`: Address updated successfully
- `400 Bad Request`: Invalid input or invalid PIN code format
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Address not found

---

#### 5. Delete Address

**Endpoint:** `DELETE /customers/addresses/:id`

**Description:** Deletes an existing address by ID for the currently authenticated customer. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Path Parameters:**
- `id`: Address ID (UUID)

**Response:**
```typescript
{
  message: "Address deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Address deleted successfully
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Address not found

---

#### 6. Set Default Address

**Endpoint:** `PATCH /customers/addresses/:id/set-default`

**Description:** Sets an address as the default address for the currently authenticated customer. This will unset other default addresses. Authentication required.

**Authentication:** Required (Bearer token, customer role)

**Path Parameters:**
- `id`: Address ID (UUID)

**Response (AddressResponseDto):** Same structure as Add Address (single object, with isDefault: true)

**Status Codes:**
- `200 OK`: Address set as default successfully
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Address not found

---

## Discount Routes

### Base Path: `/discounts`

Discount routes handle discount code validation. Public endpoint.

#### 1. Validate Discount Code

**Endpoint:** `POST /discounts/validate`

**Description:** Validates a discount code. Public endpoint for checking if a discount code is valid before applying.

**Request Body (ValidateDiscountDto):**
```typescript
{
  code: string;                // Discount code to validate (required)
  orderAmount?: number;        // Order amount for minimum order validation in INR (optional, minimum: 0)
}
```

**Response:**
```typescript
{
  valid: boolean;              // Whether discount code is valid
  code: string;                // Discount code
  discountType?: string;       // Discount type (e.g., "PERCENTAGE", "FIXED")
  value?: number;              // Discount value
  minOrderAmount?: number;     // Minimum order amount required
  maxDiscountAmount?: number;  // Maximum discount amount
  message?: string;            // Validation message
}
```

**Status Codes:**
- `200 OK`: Discount validation result
- `404 Not Found`: Discount code not found

**Example Request:**
```json
{
  "code": "SAVE20",
  "orderAmount": 1000
}
```

---

## Address Autocomplete Routes

### Base Path: `/address-autocomplete`

Address autocomplete routes provide Indian state and district suggestions for address forms. All routes are public.

#### 1. Get State Suggestions

**Endpoint:** `GET /address-autocomplete/states`

**Description:** Returns a list of Indian states matching the search query. Useful for autocomplete functionality in address forms. Public endpoint.

**Query Parameters (StateAutocompleteQueryDto):**
```typescript
{
  query: string;               // Search query for state name (minimum 2 characters, required)
  limit?: number;              // Maximum number of results to return (optional)
}
```

**Response (StateAutocompleteResponseDto):**
```typescript
{
  suggestions: StateSuggestionDto[];
  total: number;
}
```

**StateSuggestionDto Structure:**
```typescript
{
  name: string;                // State name
  code: string;                // State code
}
```

**Status Codes:**
- `200 OK`: State suggestions retrieved successfully

**Example Request:**
```
GET /address-autocomplete/states?query=Mah&limit=10
```

---

#### 2. Get All States

**Endpoint:** `GET /address-autocomplete/states/all`

**Description:** Returns a complete list of all Indian states. Useful for populating state dropdowns. Public endpoint.

**Response (StateSuggestionDto[]):** Array of all states with same structure as Get State Suggestions

**Status Codes:**
- `200 OK`: All states retrieved successfully

---

#### 3. Get District Suggestions

**Endpoint:** `GET /address-autocomplete/districts`

**Description:** Returns a list of districts matching the search query. Optionally filter by state. Useful for autocomplete functionality in address forms. Public endpoint.

**Query Parameters (DistrictAutocompleteQueryDto):**
```typescript
{
  query: string;               // Search query for district name (minimum 2 characters, required)
  state?: string;              // State name to filter districts (optional)
  limit?: number;              // Maximum number of results to return (optional)
}
```

**Response (DistrictAutocompleteResponseDto):**
```typescript
{
  suggestions: DistrictSuggestionDto[];
  total: number;
}
```

**DistrictSuggestionDto Structure:**
```typescript
{
  name: string;                // District name
  state: string;               // State name
}
```

**Status Codes:**
- `200 OK`: District suggestions retrieved successfully

**Example Request:**
```
GET /address-autocomplete/districts?query=Mum&state=Maharashtra&limit=10
```

---

#### 4. Get Districts by State

**Endpoint:** `GET /address-autocomplete/districts/by-state`

**Description:** Returns all districts for a specific state. Useful for populating district dropdowns after state selection. Public endpoint.

**Query Parameters:**
- `state`: State name (required)

**Response (DistrictSuggestionDto[]):** Array of districts with same structure as Get District Suggestions

**Status Codes:**
- `200 OK`: Districts retrieved successfully

**Example Request:**
```
GET /address-autocomplete/districts/by-state?state=Maharashtra
```

---

## Inventory Routes

### Base Path: `/inventory`

Inventory routes provide inventory health metrics. Public endpoint.

#### 1. Get Inventory Metrics

**Endpoint:** `GET /inventory/metrics`

**Description:** Returns inventory health metrics including available, reserved, reserved ratio, expired reservations count, and failed reservations count. Public endpoint.

**Response (InventoryMetricsDto):**
```typescript
{
  available: number;           // Available inventory count
  reserved: number;            // Reserved inventory count
  reservedRatio: number;      // Reserved ratio (0-1)
  expiredReservations: number;  // Count of expired reservations
  failedReservations: number;   // Count of failed reservations
}
```

**Status Codes:**
- `200 OK`: Inventory metrics retrieved successfully

---

## Authentication and Authorization

### Public Endpoints

The following endpoints are public and do not require authentication:
- All authentication routes (`/auth/*`)
- Product listing and search (`/products/*`)
- Category routes (`/categories/*`)
- Cart routes (`/cart/*`) - supports guest sessions via X-Session-Id header
- Checkout routes (`/store/checkout/*`) - supports guest sessions
- Order creation (`POST /orders`) - supports guest checkout
- Customer registration (`POST /customers/register`)
- Customer account claiming (`POST /customers/claim`)
- Discount validation (`POST /discounts/validate`)
- Address autocomplete routes (`/address-autocomplete/*`)
- Inventory metrics (`GET /inventory/metrics`)
- Product reviews listing (`GET /products/:id/reviews`)
- Review aggregates (`GET /products/:id/reviews/aggregate`)

### Authenticated Endpoints

The following endpoints require authentication (Bearer token):
- User profile (`GET /auth/profile`)
- Order listing and details (`GET /orders`, `GET /orders/:id`)
- Order status updates (`PATCH /orders/:id/status`)
- Order tracking (`GET /orders/:id/tracking`)
- Order timeline (`GET /orders/:id/timeline`)
- Customer profile management (`GET /customers/me`, `PUT /customers/me`)
- Password change (`POST /customers/change-password`)
- All address routes (`/customers/addresses/*`)
- Review creation, update, and deletion (`POST /products/:id/reviews`, `PATCH /products/reviews/:id`, `DELETE /products/reviews/:id`)
- Review helpful votes (`POST /products/reviews/:id/helpful`, `DELETE /products/reviews/:id/helpful`)

### Guest Sessions

For guest checkout and cart operations, use the `X-Session-Id` header:
- Generate a unique session ID on the client side (e.g., UUID)
- Include it in the `X-Session-Id` header for all cart and checkout operations
- The session ID links guest carts and checkout sessions

---

## Rate Limiting

Different endpoints have different rate limits:
- **Storefront GET**: Standard rate limit for public GET endpoints
- **Cart Updates**: Rate limit for cart modification operations
- **Payment Intent**: Rate limit for payment-related operations
- **Categories Search**: Rate limit for category and search operations
- **Product Detail**: Rate limit for individual product views
- **Reviews Listing**: Rate limit for review listing operations
- **Login**: Rate limit for login attempts (prevents brute force)
- **Claim Account**: Rate limit for account claiming operations

---

## Error Responses

All endpoints follow standard HTTP status codes:
- `200 OK`: Successful GET/PUT/PATCH/DELETE request
- `201 Created`: Successful POST request creating a resource
- `204 No Content`: Successful DELETE request with no content
- `400 Bad Request`: Invalid input or business logic error
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate, invalid state)
- `500 Internal Server Error`: Server error

Error response format:
```typescript
{
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

---

## Notes

1. **Currency**: All monetary values are in INR (Indian Rupees). Prices are stored as numbers (not strings).

2. **GST Calculation**: The system supports both GST-inclusive and GST-exclusive pricing. GST breakdown includes CGST, SGST, and IGST based on intra-state or inter-state transactions.

3. **Guest Checkout**: Guest checkout is supported via session IDs. If a password is provided during guest checkout, an account is automatically created.

4. **Idempotency**: Order creation supports idempotency keys to prevent duplicate orders from retries.

5. **Payment Flow**: Orders are created only after payment confirmation via webhook. The checkout flow creates a payment intent first, then redirects to the payment gateway.

6. **Bundle Support**: The cart supports both regular product variants and bundles. Bundles require selections for each choice set.

7. **Address Validation**: PIN codes are validated for Indian format (6 digits). States and districts are validated against Indian address data.

8. **Review Verification**: Reviews require verified purchases (order must be delivered) to prevent fake reviews.

---

## Conclusion

This documentation covers all storefront routes in the ecommerce application. Each route includes:
- Endpoint path and HTTP method
- Description and purpose
- Authentication requirements
- Request structure (DTOs)
- Response structure (DTOs)
- Status codes
- Rate limiting information
- Example requests where applicable

For additional information or updates, refer to the Swagger/OpenAPI documentation at `/api-docs` endpoint.

