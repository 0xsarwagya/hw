# Reviews System Overview

## Features

- Verified purchase reviews
- Moderation pipeline
- Review aggregation
- Redis caching
- Helpful votes

## Verified Purchase Flow

Only customers who have purchased a product can leave reviews.

## Moderation

Reviews go through an automatic moderation pipeline before being published.

## Aggregation

Review ratings and counts are aggregated and cached in Redis for performance.

See [Verified Purchase Flow](/docs/reviews/verified-purchase) for details.

