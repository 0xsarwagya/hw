import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { RedisStoreService } from "../../redis-store/redis-store.service";

/**
 * Review event types
 */
export enum ReviewEventType {
  REVIEW_APPROVED = "review.approved",
  REVIEW_REJECTED = "review.rejected",
  REVIEW_HELPFUL_ADDED = "review.helpful_added",
  REVIEW_HELPFUL_REMOVED = "review.helpful_removed",
}

/**
 * Review event payload
 */
export interface ReviewEventPayload {
  reviewId: string;
  variantId: string;
  customerId: string;
  rating: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ReviewEventsService implements OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly eventChannel = "review:events";

  constructor(
    redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
  ) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    try {
      this.client = await this.redisStoreService.getClient();
    } catch (error) {
      this.logger.warn(
        `Redis client not available during initialization - will retry when Redis is available: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow app to start without Redis
    }
  }

  /**
   * Emit review event
   */
  async emit(
    eventType: ReviewEventType,
    payload: ReviewEventPayload,
  ): Promise<void> {
    try {
      const event = {
        type: eventType,
        payload,
        timestamp: new Date().toISOString(),
      };

      await this.client.publish(this.eventChannel, JSON.stringify(event));

      this.logger.debug(
        `Emitted review event: ${eventType} for review ${payload.reviewId}`,
      );
    } catch (error) {
      // Don't throw - event emission failure shouldn't break the operation
      this.logger.warn(
        `Failed to emit review event ${eventType}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Emit review approved event
   */
  async emitApproved(payload: ReviewEventPayload): Promise<void> {
    await this.emit(ReviewEventType.REVIEW_APPROVED, payload);
  }

  /**
   * Emit review rejected event
   */
  async emitRejected(payload: ReviewEventPayload): Promise<void> {
    await this.emit(ReviewEventType.REVIEW_REJECTED, payload);
  }

  /**
   * Emit helpful vote added event
   */
  async emitHelpfulAdded(payload: ReviewEventPayload): Promise<void> {
    await this.emit(ReviewEventType.REVIEW_HELPFUL_ADDED, payload);
  }

  /**
   * Emit helpful vote removed event
   */
  async emitHelpfulRemoved(payload: ReviewEventPayload): Promise<void> {
    await this.emit(ReviewEventType.REVIEW_HELPFUL_REMOVED, payload);
  }
}
