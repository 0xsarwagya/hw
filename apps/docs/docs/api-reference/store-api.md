# Store API Reference

## Base URL

```
https://api.example.com
```

## Authentication

Store endpoints use JWT authentication for customer-specific operations.

## Endpoints

### Products

#### List Products
```http
GET /products?category=electronics&page=1
```

#### Get Product
```http
GET /products/:id
```

### Cart

#### Get Cart
```http
GET /cart
```

#### Add to Cart
```http
POST /cart/items
Content-Type: application/json

{
  "variantId": "uuid",
  "quantity": 2
}
```

### Checkout

#### Start Checkout
```http
POST /checkout/start
```

#### Confirm Checkout
```http
POST /checkout/confirm
Content-Type: application/json

{
  "sessionId": "session-123",
  "paymentId": "pay_xyz"
}
```

### Orders

#### List Orders
```http
GET /orders
```

#### Get Order
```http
GET /orders/:id
```

### Reviews

#### List Reviews
```http
GET /products/:id/reviews
```

#### Create Review
```http
POST /products/:id/reviews
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great product!"
}
```

## Response Format

See [Admin API Response Format](/docs/api-reference/admin-api#response-format) for response structure.

