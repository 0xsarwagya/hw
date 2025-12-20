import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class QuerySystemLogsDto {
  @ApiPropertyOptional({
    description: "Log level filter",
    example: "error",
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({
    description: "Start timestamp (ISO 8601)",
    example: "2025-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: "End timestamp (ISO 8601)",
    example: "2025-01-31T23:59:59Z",
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    description: "Module filter",
    example: "orders",
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: "Text search in message",
    example: "error",
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: "Cursor for pagination",
    example: "1704067200000-0",
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: "Limit number of results",
    example: 100,
    default: 100,
  })
  @IsOptional()
  limit?: number;
}

export class SystemLogEntryDto {
  @ApiProperty({
    description: "Log timestamp",
  })
  timestamp: string;

  @ApiProperty({
    description: "Log level",
  })
  level: string;

  @ApiProperty({
    description: "Log message",
  })
  message: string;

  @ApiPropertyOptional({
    description: "Log context",
  })
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Trace ID",
  })
  traceId?: string;

  @ApiPropertyOptional({
    description: "Span ID",
  })
  spanId?: string;

  @ApiPropertyOptional({
    description: "Module name",
  })
  module?: string;
}

export class PaginatedSystemLogsResponseDto {
  @ApiProperty({
    description: "List of log entries",
    type: [SystemLogEntryDto],
  })
  data: SystemLogEntryDto[];

  @ApiPropertyOptional({
    description: "Next cursor for pagination",
  })
  nextCursor?: string;

  @ApiProperty({
    description: "Number of results returned",
  })
  count: number;
}
