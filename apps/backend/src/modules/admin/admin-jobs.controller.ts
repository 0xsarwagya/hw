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
  constructor(private readonly jobsService: BackgroundJobsService) {}

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

    // Note: Actual job triggering would need to be implemented
    // by calling the respective service methods directly
    // For now, we just return a success message
    return {
      message:
        "Job trigger requested. Note: Manual triggering requires service integration.",
      jobName,
    };
  }
}
