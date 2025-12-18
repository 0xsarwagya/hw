# Admin API Reference

## Base URL

```
https://api.example.com/admin
```

## Authentication

All admin endpoints require authentication via JWT token in httpOnly cookies.

## Endpoints

### Authentication

#### Login
```http
POST /admin/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password",
  "deviceId": "device-123"
}
```

#### Refresh Token
```http
POST /admin/auth/refresh
```

#### Logout
```http
DELETE /admin/auth/logout
```

### Products

#### List Products
```http
GET /admin/products?page=1&limit=20
```

#### Create Product
```http
POST /admin/products
Content-Type: application/json

{
  "title": "Product Name",
  "description": "Product description",
  "price": 999.99
}
```

### Orders

#### List Orders
```http
GET /admin/orders?status=pending&page=1
```

#### Get Order
```http
GET /admin/orders/:id
```

### Pricing

#### Create Price List
```http
POST /admin/pricing/price-lists
Content-Type: application/json

{
  "name": "VIP Pricing",
  "customerGroupId": "uuid"
}
```

### Discounts

#### Create Discount
```http
POST /admin/discounts
Content-Type: application/json

{
  "code": "SAVE20",
  "type": "percentage",
  "value": 20
}
```

## Response Format

All responses follow a consistent format:

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation error",
  "errors": []
}
```

