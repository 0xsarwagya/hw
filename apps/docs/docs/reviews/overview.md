# Reviews System

The reviews system enables customers to share feedback on purchased products while providing robust content moderation, aggregation, and caching capabilities. It ensures authentic reviews through verified purchase validation and maintains review quality through automated and manual moderation.

## Review Architecture

### Core Components
- **Review Creation**: Verified purchase validation and content submission
- **Review Moderation**: Automated and manual content filtering
- **Review Aggregation**: Statistics and analytics generation
- **Review Caching**: Performance optimization with Redis caching
- **Review Events**: Audit trail and real-time updates

### Review States

```typescript
enum ReviewStatus {
  PENDING = "pending",    // Awaiting moderation
  APPROVED = "approved",  // Published and visible
  REJECTED = "rejected",  // Rejected during moderation
}
```

## Review Data Structure

### Review Entity
```typescript
interface Review {
  id: string;
  customerId: string;
  orderId: string;
  variantId: string;
  rating: number;        // 1-5 star rating
  title?: string;        // Optional review title
  body: string;          // Review content (required)
  images?: string[];     // Up to 5 image URLs
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### Review Constraints
- **Unique per Customer-Variant**: One review per customer per product variant
- **Verified Purchase Required**: Reviews only allowed for delivered orders
- **Image Limit**: Maximum 5 images per review
- **Rating Range**: 1-5 stars only

## Verified Purchase Validation

### Purchase Verification Logic
```typescript
async validateVerifiedPurchase(
  customerId: string,
  orderId: string,
  variantId: string
): Promise<void> {
  // 1. Verify order belongs to customer
  // 2. Check order status is 'delivered'
  // 3. Confirm variant exists in order items
  // 4. Ensure order delivery date is within review window
}
```

### Review Eligibility Rules
- **Order Status**: Must be `delivered` (not just `shipped`)
- **Ownership**: Customer must be the order owner
- **Product Purchase**: Variant must be in customer's order items
- **Time Window**: Reviews allowed within configurable period after delivery

## Review Creation Process

### Submission Workflow
```typescript
async createReview(customerId: string, reviewData: CreateReviewDto): Promise<Review> {
  // 1. Validate verified purchase
  // 2. Check for existing reviews
  // 3. Validate content and images
  // 4. Create review with PENDING status
  // 5. Trigger moderation workflow
  // 6. Cache invalidation
  // 7. Emit review events
}
```

### Content Validation
```typescript
interface CreateReviewDto {
  orderId: string;
  variantId: string;
  rating: number;      // 1-5, required
  title?: string;      // Optional, max 200 chars
  body: string;        // Required, min 10 chars, max 2000 chars
  images?: string[];   // Optional, max 5 URLs
}
```

### Image Management
- **Upload**: Images uploaded via storage service
- **Validation**: File type, size, and content checks
- **Processing**: Thumbnail generation and optimization
- **Storage**: CDN-backed URLs with access control

## Review Moderation System

### Automated Moderation
```typescript
interface ModerationResult {
  status: ReviewStatus;
  flags: ModerationFlag[];
  score: number;        // 0-100 confidence score
  reasons: string[];    // Rejection reasons
}

enum ModerationFlag {
  SPAM = "spam",
  OFFENSIVE = "offensive",
  INAPPROPRIATE = "inappropriate",
  FAKE = "fake",
  IRRELEVANT = "irrelevant",
}
```

### Moderation Rules
- **Spam Detection**: Pattern matching and frequency analysis
- **Content Filtering**: Profanity and inappropriate language detection
- **Relevance Check**: Ensures review relates to purchased product
- **Authenticity**: Cross-references with purchase history

### Manual Review Queue
```typescript
// Reviews flagged for manual review
interface ManualReviewQueue {
  reviewId: string;
  priority: 'high' | 'medium' | 'low';
  flags: ModerationFlag[];
  assignedTo?: string;  // Admin user ID
  reviewedAt?: Date;
}
```

## Review Aggregation & Analytics

### Product Statistics
```typescript
interface ProductReviewStats {
  variantId: string;
  totalReviews: number;
  averageRating: number;     // 1.0 - 5.0
  ratingDistribution: {
    1: number; 2: number; 3: number;
    4: number; 5: number;
  };
  verifiedPurchaseCount: number;
  lastReviewDate: Date;
  helpfulVotes: number;
}
```

### Aggregation Process
```typescript
async updateProductStats(variantId: string): Promise<void> {
  // 1. Query all approved reviews for variant
  // 2. Calculate average rating and distribution
  // 3. Count verified purchases
  // 4. Update cached statistics
  // 5. Invalidate old cache entries
}
```

### Real-time Updates
- **Incremental Updates**: Statistics updated on review approval/rejection
- **Batch Processing**: Periodic full recalculation for accuracy
- **Cache Invalidation**: Immediate cache updates for consistency

## Caching Strategy

### Redis Cache Structure
```
review:stats:{variantId} → ProductReviewStats
review:product:{variantId}:{page}:{limit} → ReviewList
review:customer:{customerId}:{variantId} → CustomerReview
review:helpful:{reviewId} → HelpfulVoteCount
```

### Cache Invalidation
```typescript
// Invalidate on review changes
async invalidateReviewCache(reviewId: string, variantId: string): Promise<void> {
  // 1. Delete review-specific cache
  // 2. Update product statistics cache
  // 3. Invalidate paginated lists
  // 4. Update search indexes
}
```

### Cache TTL Strategy
- **Statistics**: 1 hour (frequently accessed)
- **Review Lists**: 30 minutes (paginated results)
- **Individual Reviews**: 24 hours (stable content)

## Review Search & Filtering

### Search Capabilities
```typescript
interface ReviewSearchFilters {
  variantId?: string;
  customerId?: string;
  rating?: number[];      // Filter by specific ratings
  verifiedOnly?: boolean; // Only verified purchase reviews
  status?: ReviewStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}
```

### Advanced Filtering
- **Rating Filter**: Show only 4+ star reviews
- **Verified Purchase**: Filter for authenticity
- **Date Range**: Reviews within specific periods
- **Content Search**: Full-text search in review content

## Helpful Votes System

### Vote Structure
```typescript
interface HelpfulVote {
  id: string;
  reviewId: string;
  customerId: string;    // Voter's customer ID
  voteType: 'helpful' | 'not_helpful';
  createdAt: Date;
}

// Unique constraint: one vote per customer per review
```

### Vote Aggregation
```typescript
interface ReviewWithVotes extends Review {
  helpfulCount: number;
  totalVotes: number;
  helpfulPercentage: number; // helpfulCount / totalVotes
}
```

### Vote Validation
- **One Vote Per Customer**: Prevents vote manipulation
- **Own Review Restriction**: Cannot vote on own reviews
- **Verified Purchase**: Optional requirement for voting

## API Endpoints

### Review Management
```http
# Create review
POST /storefront/reviews
{
  "orderId": "order-123",
  "variantId": "variant-456",
  "rating": 5,
  "title": "Excellent product!",
  "body": "Highly recommend this item...",
  "images": ["url1.jpg", "url2.jpg"]
}

# Get product reviews
GET /storefront/products/{productId}/reviews?page=1&limit=10&sort=rating

# Update review (within edit window)
PATCH /storefront/reviews/{reviewId}
{
  "title": "Updated title",
  "body": "Updated review content"
}

# Delete review
DELETE /storefront/reviews/{reviewId}
```

### Admin Operations
```http
# Get all reviews with filters
GET /admin/reviews?status=pending&page=1&limit=50

# Moderate review
PATCH /admin/reviews/{reviewId}/moderate
{
  "status": "approved",
  "moderationNote": "Approved after manual review"
}

# Bulk moderate
POST /admin/reviews/bulk-moderate
{
  "reviewIds": ["review-1", "review-2"],
  "status": "approved"
}

# Get review statistics
GET /admin/reviews/stats?variantId=variant-123
```

### Social Features
```http
# Vote helpful/not helpful
POST /storefront/reviews/{reviewId}/vote
{
  "voteType": "helpful"
}

# Get review with votes
GET /storefront/reviews/{reviewId}
```

## Content Moderation Rules

### Automatic Rejection Criteria
```typescript
const REJECTION_RULES = [
  // Spam patterns
  /\b(?:viagra|casino|lottery)\b/i,
  // Excessive caps
  /^[A-Z\s]{50,}/,
  // Short meaningless reviews
  /^\s*(?:good|nice|ok|fine|okay)\s*$/i,
  // Profanity (configurable list)
  profanityFilter,
  // Irrelevant content
  irrelevantContentDetector,
];
```

### Manual Review Triggers
- **Borderline Content**: Requires human judgment
- **Mixed Signals**: Automated systems disagree
- **High-Value Products**: Luxury items get extra scrutiny
- **First-Time Reviewers**: New customers flagged for review

## Performance Optimization

### Database Optimization
```sql
-- Optimized indexes for common queries
CREATE INDEX CONCURRENTLY reviews_variant_rating_idx
ON reviews(variant_id, rating DESC, created_at DESC)
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY reviews_pending_moderation_idx
ON reviews(status, created_at)
WHERE status = 'pending';
```

### Query Optimization
- **Pagination**: Efficient offset-based pagination
- **Filtering**: Indexed queries for common filters
- **Aggregation**: Pre-computed statistics for performance
- **Search**: Full-text search with ranking

## Monitoring & Analytics

### Review Metrics
```typescript
// Review submission metrics
review_submission_rate: counter
review_approval_rate: gauge
review_rejection_rate: gauge

// Content quality metrics
average_review_length: gauge
average_rating_distribution: histogram
verified_purchase_percentage: gauge

// Engagement metrics
helpful_vote_rate: gauge
review_response_time: histogram
moderation_queue_length: gauge
```

### Business Intelligence
```typescript
// Product performance
top_rated_products: gauge
most_reviewed_products: gauge
review_velocity: gauge

// Customer satisfaction
average_rating_trend: gauge
verified_vs_unverified_ratings: gauge
review_completion_rate: gauge
```

## Security & Abuse Prevention

### Rate Limiting
```typescript
// Review submission limits
maxReviewsPerHour: 5,
maxReviewsPerDay: 20,
maxImagesPerReview: 5,
```

### Spam Prevention
- **Duplicate Detection**: Similarity analysis
- **Pattern Recognition**: Spam pattern matching
- **Behavioral Analysis**: Review velocity monitoring
- **IP Filtering**: Basic IP-based abuse prevention

### Content Security
- **XSS Prevention**: Input sanitization
- **Injection Protection**: Parameterized queries
- **File Upload Security**: Image validation and scanning
- **Privacy Protection**: Customer data anonymization

## Integration Points

### Product Display
- **Review Summary**: Star ratings and review counts on product pages
- **Review Widget**: Embedded review display with sorting/filtering
- **Review Incentives**: Gamification for review completion

### Order System
- **Post-Delivery Reviews**: Automated review requests after delivery
- **Review Reminders**: Email/SMS prompts for pending reviews
- **Purchase Verification**: Order status integration for verification

### Marketing
- **Review Marketing**: Featured reviews in marketing campaigns
- **SEO Enhancement**: Rich snippets for search engine optimization
- **Social Proof**: Review display for conversion optimization

## Best Practices

### Content Quality
1. **Encourage Detail**: Guide customers to write comprehensive reviews
2. **Photo Requirements**: Encourage authentic product photos
3. **Verification Badges**: Highlight verified purchase reviews
4. **Response System**: Enable seller responses to reviews

### Moderation Strategy
1. **Transparent Rules**: Clear guidelines for acceptable content
2. **Consistent Application**: Standardized moderation decisions
3. **Appeals Process**: Allow review authors to appeal rejections
4. **Learning System**: Improve automated moderation over time

### Performance
1. **Efficient Caching**: Balance freshness with performance
2. **Scalable Architecture**: Handle high review volumes
3. **Real-time Updates**: Immediate cache invalidation
4. **Backup Systems**: Redundant storage and processing

### Analytics
1. **Actionable Insights**: Focus on business-relevant metrics
2. **Trend Analysis**: Track rating and sentiment changes
3. **Competitive Intelligence**: Compare with market benchmarks
4. **Customer Feedback**: Use reviews for product improvement