# Database Tables

## Core Tables

### users

Stores user accounts (customers and admins):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Nullable for guest users
  role TEXT NOT NULL, -- 'customer', 'admin', 'support', 'reviewer', 'marketing'
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

**Note:** `password_hash` is nullable to support guest checkout. Guest users have `password_hash = NULL`.

### customers

Stores customer profiles (both authenticated and guest customers):

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gstin TEXT UNIQUE,
  is_guest BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  customer_group_id UUID REFERENCES customer_groups(id),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

**Key Fields:**
- `is_guest` - `true` for guest customers, `false` for registered customers
- `email_verified` - `true` if email is verified (always `true` if password set during checkout)
- `user_id` - Links to users table (required, but user may have null password_hash for guests)

**Guest Customer Characteristics:**
- `is_guest = true`
- `email_verified = false` (unless password was set during checkout)
- Associated user has `password_hash = NULL`

### products

Product catalog:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- 'draft', 'active', 'archived'
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### product_variants

Product variants with pricing:

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  sku TEXT UNIQUE,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  sale_start_date TIMESTAMP,
  sale_end_date TIMESTAMP,
  inventory_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Pricing Tables

### price_lists

Price list definitions:

```sql
CREATE TABLE price_lists (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'STANDARD', 'SALE', 'CUSTOM'
  priority INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);
```

### price_list_items

Price list overrides:

```sql
CREATE TABLE price_list_items (
  id UUID PRIMARY KEY,
  price_list_id UUID REFERENCES price_lists(id),
  product_variant_id UUID REFERENCES product_variants(id),
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES categories(id),
  override_type TEXT NOT NULL, -- 'FIXED', 'PERCENTAGE'
  override_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

### customer_groups

Customer segmentation:

```sql
CREATE TABLE customer_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Discount Tables

### discounts

Discount definitions:

```sql
CREATE TABLE discounts (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE', 'TIERED', 'BUY_X_GET_Y'
  value DECIMAL(10,2) NOT NULL,
  scope TEXT NOT NULL, -- 'PRODUCT', 'ORDER'
  priority INTEGER NOT NULL,
  can_stack BOOLEAN DEFAULT false,
  min_order_value DECIMAL(10,2),
  usage_limit INTEGER,
  usage_limit_per_customer INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Order Tables

### orders

Order records:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  status TEXT NOT NULL, -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  total_amount DECIMAL(10,2) NOT NULL,
  pricing_snapshot JSONB,
  discount_snapshot JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### order_items

Order line items:

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

## Admin Tables

### admin_sessions

Admin authentication sessions:

```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  refresh_token_hash TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP NOT NULL
);
```

### admin_activity_logs

Admin action audit log:

```sql
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL
);
```

## Indexes

Key indexes for performance:

- `users.email` (UNIQUE)
- `product_variants.sku` (UNIQUE)
- `orders.customer_id`
- `orders.status`
- `order_items.order_id`
- `admin_sessions.admin_id`
- `admin_sessions.refresh_token_hash` (UNIQUE)

