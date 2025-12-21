import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";

export interface JobExecution {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "success" | "failure";
  duration?: number;
  error?: string;
}

export interface JobStatus {
  name: string;
  description: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  status: "idle" | "running" | "error";
  lastDuration?: number;
  lastError?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

@Injectable()
export class BackgroundJobsService {
  private readonly JOBS_KEY_PREFIX = "admin:jobs:";
  private readonly EXECUTION_HISTORY_KEY_PREFIX = "admin:jobs:history:";
  private readonly MAX_HISTORY = 100; // Keep last 100 executions per job

  constructor(
    private readonly redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Get all background jobs with their status
   */
  async getAllJobs(): Promise<JobStatus[]> {
    const jobs: Array<Pick<JobStatus, "name" | "description" | "schedule">> = [
      {
        name: "inventory-reconciliation",
        description: "Periodic inventory reconciliation (every 7 minutes)",
        schedule: "*/7 * * * *",
      },
      {
        name: "media-consistency-maintenance",
        description: "Nightly media consistency maintenance (daily at 3 AM)",
        schedule: "0 3 * * *",
      },
      {
        name: "discount-warmup",
        description: "Discount cache warmup (every 10 minutes)",
        schedule: "*/10 * * * *",
      },
      {
        name: "pricing-warmup",
        description: "Pricing cache warmup (every 10 minutes)",
        schedule: "*/10 * * * *",
      },
    ];

    const client = await this.redisStoreService.getClient();

    // Load status for each job from Redis
    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => {
        const statusKey = `${this.JOBS_KEY_PREFIX}${job.name}:status`;
        const statusData = await client.get(statusKey);

        if (statusData) {
          try {
            const parsed = JSON.parse(statusData);
            return {
              ...job,
              lastRun: parsed.lastRun ? new Date(parsed.lastRun) : undefined,
              nextRun: parsed.nextRun ? new Date(parsed.nextRun) : undefined,
              status: parsed.status || "idle",
              lastDuration: parsed.lastDuration,
              lastError: parsed.lastError,
              executionCount: parsed.executionCount || 0,
              successCount: parsed.successCount || 0,
              failureCount: parsed.failureCount || 0,
            };
          } catch (error) {
            this.logger.warn(
              createLogContext(this.contextService, "getAllJobs", {
                jobName: job.name,
                error: error instanceof Error ? error.message : String(error),
              }),
              `Failed to parse status for job: ${job.name}`,
            );
          }
        }

        return {
          ...job,
          status: "idle" as const,
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
        };
      }),
    );

    return jobsWithStatus;
  }

  /**
   * Get execution history for a specific job
   */
  async getJobHistory(jobName: string, limit = 50): Promise<JobExecution[]> {
    const client = await this.redisStoreService.getClient();
    const historyKey = `${this.EXECUTION_HISTORY_KEY_PREFIX}${jobName}`;

    try {
      const historyData = await client.lrange(historyKey, 0, limit - 1);
      return historyData
        .map((item) => {
          try {
            const parsed = JSON.parse(item);
            return {
              ...parsed,
              startTime: new Date(parsed.startTime),
              endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
            };
          } catch (error) {
            this.logger.warn(
              createLogContext(this.contextService, "getJobHistory", {
                jobName,
                error: error instanceof Error ? error.message : String(error),
              }),
              `Failed to parse history item for job: ${jobName}`,
            );
            return null;
          }
        })
        .filter((item): item is JobExecution => item !== null);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getJobHistory", error, {
          jobName,
        }),
        `Failed to get history for job: ${jobName}`,
      );
      return [];
    }
  }

  /**
   * Record job execution start
   */
  async recordJobStart(jobName: string): Promise<void> {
    const client = await this.redisStoreService.getClient();
    const statusKey = `${this.JOBS_KEY_PREFIX}${jobName}:status`;
    const historyKey = `${this.EXECUTION_HISTORY_KEY_PREFIX}${jobName}`;

    const execution: JobExecution = {
      jobName,
      startTime: new Date(),
      status: "running",
    };

    // Update status
    const statusData = {
      status: "running",
      lastRun: new Date().toISOString(),
      executionCount: (await this.getExecutionCount(client, jobName)) + 1,
    };
    await client.set(statusKey, JSON.stringify(statusData));

    // Add to history
    await client.lpush(historyKey, JSON.stringify(execution));
    await client.ltrim(historyKey, 0, this.MAX_HISTORY - 1);
  }

  /**
   * Record job execution completion
   */
  async recordJobCompletion(
    jobName: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    const client = await this.redisStoreService.getClient();
    const statusKey = `${this.JOBS_KEY_PREFIX}${jobName}:status`;
    const historyKey = `${this.EXECUTION_HISTORY_KEY_PREFIX}${jobName}`;

    // Get the most recent execution from history
    const recentHistory = await client.lrange(historyKey, 0, 0);
    if (recentHistory.length > 0) {
      try {
        const execution = JSON.parse(recentHistory[0]) as JobExecution;
        const endTime = new Date();
        const duration =
          endTime.getTime() - new Date(execution.startTime).getTime();

        const updatedExecution: JobExecution = {
          ...execution,
          endTime,
          status: success ? "success" : "failure",
          duration,
          error: error || undefined,
        };

        // Update the history entry
        await client.lset(historyKey, 0, JSON.stringify(updatedExecution));

        // Update status
        const currentStatus = await client.get(statusKey);
        const statusData = currentStatus
          ? JSON.parse(currentStatus)
          : { executionCount: 0, successCount: 0, failureCount: 0 };

        statusData.status = "idle";
        statusData.lastDuration = duration;
        statusData.lastError = error || undefined;
        statusData.successCount =
          (statusData.successCount || 0) + (success ? 1 : 0);
        statusData.failureCount =
          (statusData.failureCount || 0) + (success ? 0 : 1);

        await client.set(statusKey, JSON.stringify(statusData));
      } catch (error) {
        this.logger.warn(
          createLogContext(this.contextService, "recordJobCompletion", {
            jobName,
            error: error instanceof Error ? error.message : String(error),
          }),
          `Failed to update execution history for job: ${jobName}`,
        );
      }
    }
  }

  /**
   * Get execution count for a job
   */
  private async getExecutionCount(
    client: Redis,
    jobName: string,
  ): Promise<number> {
    const statusKey = `${this.JOBS_KEY_PREFIX}${jobName}:status`;
    const statusData = await client.get(statusKey);
    if (statusData) {
      try {
        const parsed = JSON.parse(statusData);
        return parsed.executionCount || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }
}
