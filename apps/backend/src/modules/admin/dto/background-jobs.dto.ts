import { ApiProperty } from "@nestjs/swagger";

export class JobExecutionDto {
  @ApiProperty({ description: "Job name" })
  jobName: string;

  @ApiProperty({ description: "Execution start time" })
  startTime: Date;

  @ApiProperty({ description: "Execution end time", required: false })
  endTime?: Date;

  @ApiProperty({
    description: "Execution status",
    enum: ["running", "success", "failure"],
  })
  status: "running" | "success" | "failure";

  @ApiProperty({
    description: "Execution duration in milliseconds",
    required: false,
  })
  duration?: number;

  @ApiProperty({ description: "Error message if failed", required: false })
  error?: string;
}

export class JobStatusDto {
  @ApiProperty({ description: "Job name" })
  name: string;

  @ApiProperty({ description: "Job description" })
  description: string;

  @ApiProperty({ description: "Cron schedule expression" })
  schedule: string;

  @ApiProperty({ description: "Last execution time", required: false })
  lastRun?: Date;

  @ApiProperty({
    description: "Next scheduled execution time",
    required: false,
  })
  nextRun?: Date;

  @ApiProperty({
    description: "Current job status",
    enum: ["idle", "running", "error"],
  })
  status: "idle" | "running" | "error";

  @ApiProperty({
    description: "Duration of last execution in milliseconds",
    required: false,
  })
  lastDuration?: number;

  @ApiProperty({
    description: "Error message from last execution",
    required: false,
  })
  lastError?: string;

  @ApiProperty({ description: "Total number of executions" })
  executionCount: number;

  @ApiProperty({ description: "Number of successful executions" })
  successCount: number;

  @ApiProperty({ description: "Number of failed executions" })
  failureCount: number;
}

export class JobsListResponseDto {
  @ApiProperty({ type: [JobStatusDto], description: "List of background jobs" })
  jobs: JobStatusDto[];
}

export class JobHistoryResponseDto {
  @ApiProperty({ description: "Job name" })
  jobName: string;

  @ApiProperty({
    type: [JobExecutionDto],
    description: "Execution history",
  })
  history: JobExecutionDto[];
}
