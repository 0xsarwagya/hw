# Entity Relationship Diagram

## Core Entities

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ CUSTOMER_GROUPS : belongs_to
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "ordered as"
    ORDERS ||--o{ ORDER_ITEMS : contains
    CUSTOMER_GROUPS ||--o{ PRICE_LISTS : "has access to"
    PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : contains
    PRODUCT_VARIANTS ||--o{ PRICE_LIST_ITEMS : "priced by"
    PRODUCTS ||--o{ PRICE_LIST_ITEMS : "priced by"
    CATEGORIES ||--o{ PRICE_LIST_ITEMS : "priced by"
    USERS ||--o{ ADMIN_SESSIONS : "has sessions"
    USERS ||--o{ ADMIN_ACTIVITY_LOGS : "performs actions"
    PRODUCTS ||--o{ REVIEWS : "has reviews"
    USERS ||--o{ REVIEWS : "writes"
    ORDERS ||--o{ REVIEWS : "verified by"
```

## Relationships

### Users → Orders

One user can place many orders.

### Products → Variants

One product can have many variants.

### Orders → Order Items

One order contains many order items.

### Customer Groups → Price Lists

One customer group can have access to many price lists.

### Price Lists → Price List Items

One price list contains many price list items.

### Users → Admin Sessions

One admin user can have many active sessions.

### Users → Admin Activity Logs

One admin user generates many activity log entries.

## Key Relationships

- **Users** are the central entity (customers and admins)
- **Products** and **Variants** form the catalog
- **Orders** link users to products via order items
- **Pricing** is managed through customer groups and price lists
- **Admin** operations are tracked through sessions and activity logs

