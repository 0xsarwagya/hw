import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { DiscountWarmupWorker } from "../discounts/services/discount-warmup-worker.service";
import { PricingWarmupWorker } from "../pricing/services/pricing-warmup-worker.service";
import { MediaConsistencyWorker } from "../products/services/media-consistency-worker.service";
import { InventoryRecoveryService } from "../redis-store/services/inventory-recovery.service";
import {
  JobHistoryResponseDto,
  JobsListResponseDto,
} from "./dto/background-jobs.dto";
import { BackgroundJobsService } from "./services/background-jobs.service";

@ApiTags("admin")
@Controller("admin/jobs")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminJobsController {
  constructor(
    private readonly jobsService: BackgroundJobsService,
    // Inject job services for manual triggering
    private readonly inventoryRecoveryService: InventoryRecoveryService,
    private readonly mediaConsistencyWorker: MediaConsistencyWorker,
    private readonly discountWarmupWorker: DiscountWarmupWorker,
    private readonly pricingWarmupWorker: PricingWarmupWorker,
  ) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all background jobs",
    description:
      "Returns a list of all background jobs with their current status, last run time, and execution statistics.",
  })
  @ApiResponse({
    status: 200,
    description: "List of background jobs",
    type: JobsListResponseDto,
  })
  async getAllJobs(): Promise<JobsListResponseDto> {
    const jobs = await this.jobsService.getAllJobs();
    return { jobs };
  }

  @Get(":jobName/history")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get execution history for a job",
    description:
      "Returns execution history for a specific background job, including start/end times, duration, and status.",
  })
  @ApiParam({
    name: "jobName",
    description: "Job name",
    example: "inventory-reconciliation",
  })
  @ApiResponse({
    status: 200,
    description: "Job execution history",
    type: JobHistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Job not found",
  })
  async getJobHistory(
    @Param("jobName") jobName: string,
  ): Promise<JobHistoryResponseDto> {
    const history = await this.jobsService.getJobHistory(jobName);
    return {
      jobName,
      history,
    };
  }

  @Post(":jobName/trigger")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Manually trigger a background job",
    description:
      "Manually trigger a background job execution. This is useful for testing or immediate execution.",
  })
  @ApiParam({
    name: "jobName",
    description: "Job name",
    example: "inventory-reconciliation",
  })
  @ApiResponse({
    status: 200,
    description: "Job triggered successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Job triggered successfully",
        },
        jobName: {
          type: "string",
          example: "inventory-reconciliation",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (job not found or cannot be triggered)",
  })
  async triggerJob(@Param("jobName") jobName: string) {
    // Validate job name
    const validJobs = [
      "inventory-reconciliation",
      "media-consistency-maintenance",
      "discount-warmup",
      "pricing-warmup",
    ];

    if (!validJobs.includes(jobName)) {
      throw new BadRequestException(
        `Invalid job name. Valid jobs: ${validJobs.join(", ")}`,
      );
    }

    // Record job start
    await this.jobsService.recordJobStart(jobName);

    try {
      // Trigger the actual job based on job name
      switch (jobName) {
        case "inventory-reconciliation":
          await this.inventoryRecoveryService.handleReconciliation();
          break;
        case "media-consistency-maintenance":
          await this.mediaConsistencyWorker.handleNightlyMaintenance();
          break;
        case "discount-warmup":
          await this.discountWarmupWorker.warmup();
          break;
        case "pricing-warmup":
          await this.pricingWarmupWorker.warmup();
          break;
        default:
          throw new BadRequestException(`Unknown job: ${jobName}`);
      }

      // Record successful completion
      await this.jobsService.recordJobCompletion(jobName, true);

      return {
        message: "Job triggered and executed successfully",
        jobName,
      };
    } catch (error) {
      // Record failure
      await this.jobsService.recordJobCompletion(
        jobName,
        false,
        error instanceof Error ? error.message : "Unknown error",
      );

      throw error;
    }
  }
}
