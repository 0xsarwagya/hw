import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ReviewResponseDto } from "./dto/review-response.dto";
import { ReviewModerationService } from "./services/review-moderation.service";

@ApiTags("admin")
@Controller("admin/reviews")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminReviewsController {
  constructor(private readonly moderationService: ReviewModerationService) {}

  @Get("pending")
  @ApiOperation({
    summary: "Get all pending reviews",
    description: "Get all reviews awaiting moderation. Admin-only endpoint.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 20)",
  })
  @ApiOkResponse({
    description: "Pending reviews retrieved successfully",
    type: [ReviewResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  @ApiForbiddenResponse({
    description: "Forbidden - Admin access required",
  })
  async getPendingReviews(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.moderationService.getPendingReviews(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post(":reviewId/approve")
  @ApiOperation({
    summary: "Approve a review",
    description:
      "Approve a pending review. Updates aggregates and cache. Admin-only endpoint.",
  })
  @ApiParam({
    name: "reviewId",
    description: "Review ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Review approved successfully",
    type: ReviewResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Review not found or already approved",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  @ApiForbiddenResponse({
    description: "Forbidden - Admin access required",
  })
  async approveReview(
    @Param("reviewId") reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.moderationService.approveReview(reviewId);
  }

  @Post(":reviewId/reject")
  @ApiOperation({
    summary: "Reject a review",
    description:
      "Reject a review. If previously approved, removes from aggregates. Admin-only endpoint.",
  })
  @ApiParam({
    name: "reviewId",
    description: "Review ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Review rejected successfully",
    type: ReviewResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Review not found or already rejected",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  @ApiForbiddenResponse({
    description: "Forbidden - Admin access required",
  })
  async rejectReview(
    @Param("reviewId") reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.moderationService.rejectReview(reviewId);
  }

  @Delete(":reviewId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Hard delete a review (admin)",
    description:
      "Permanently delete a review. Admin-only. If approved, removes from aggregates.",
  })
  @ApiParam({
    name: "reviewId",
    description: "Review ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Review deleted successfully",
  })
  @ApiBadRequestResponse({
    description: "Review not found",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  @ApiForbiddenResponse({
    description: "Forbidden - Admin access required",
  })
  async deleteReview(@Param("reviewId") reviewId: string): Promise<void> {
    return this.moderationService.deleteReview(reviewId);
  }

  @Get("search")
  @ApiOperation({
    summary: "Search reviews (admin)",
    description:
      "Search reviews with filters (variant, customer, status, rating). Admin-only endpoint.",
  })
  @ApiQuery({
    name: "variantId",
    required: false,
    type: String,
    description: "Filter by variant ID",
  })
  @ApiQuery({
    name: "customerId",
    required: false,
    type: String,
    description: "Filter by customer ID",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["pending", "approved", "rejected"],
    description: "Filter by status",
  })
  @ApiQuery({
    name: "minRating",
    required: false,
    type: Number,
    description: "Minimum rating (1-5)",
  })
  @ApiQuery({
    name: "maxRating",
    required: false,
    type: Number,
    description: "Maximum rating (1-5)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 20)",
  })
  @ApiOkResponse({
    description: "Reviews retrieved successfully",
    type: [ReviewResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  @ApiForbiddenResponse({
    description: "Forbidden - Admin access required",
  })
  async searchReviews(
    @Query("variantId") variantId?: string,
    @Query("customerId") customerId?: string,
    @Query("status") status?: "pending" | "approved" | "rejected",
    @Query("minRating") minRating?: number,
    @Query("maxRating") maxRating?: number,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.moderationService.searchReviews(
      {
        variantId,
        customerId,
        status,
        minRating: minRating ? Number(minRating) : undefined,
        maxRating: maxRating ? Number(maxRating) : undefined,
      },
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
