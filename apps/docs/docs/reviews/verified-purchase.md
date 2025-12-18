# Verified Purchase Reviews

## Overview

Only customers who have purchased a product can leave reviews, ensuring authenticity.

## Flow

1. Customer completes order
2. Order status changes to "delivered"
3. Customer can leave review
4. Review requires order verification

## API

```http
POST /products/:id/reviews
```

Requires authentication and verified purchase.

