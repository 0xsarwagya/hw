import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../redis-store/redis-store.module";
import { AdminReviewsController } from "./admin-reviews.controller";
import { ReviewsController } from "./reviews.controller";
import { ReviewAggregationService } from "./services/review-aggregation.service";
import { ReviewCacheService } from "./services/review-cache.service";
import { ReviewEventsService } from "./services/review-events.service";
import { ReviewModerationService } from "./services/review-moderation.service";
import { ReviewsService } from "./services/reviews.service";

@Module({
  imports: [RedisStoreModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [
    ReviewsService,
    ReviewAggregationService,
    ReviewModerationService,
    ReviewCacheService,
    ReviewEventsService,
  ],
  exports: [
    ReviewsService,
    ReviewAggregationService,
    ReviewModerationService,
    ReviewCacheService,
  ],
})
export class ReviewsModule {}
