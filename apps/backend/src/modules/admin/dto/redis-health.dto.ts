import { ApiProperty } from "@nestjs/swagger";

export class RedisConnectionDto {
  @ApiProperty({
    description: "Connection status",
    enum: ["connected", "disconnected", "error"],
  })
  status: "connected" | "disconnected" | "error";

  @ApiProperty({
    description: "Connection latency in milliseconds",
    required: false,
  })
  latency?: number;
}

export class RedisMemoryDto {
  @ApiProperty({ description: "Used memory in bytes" })
  used: number;

  @ApiProperty({ description: "Peak memory usage in bytes" })
  peak: number;

  @ApiProperty({ description: "Total memory limit in bytes" })
  total: number;

  @ApiProperty({ description: "Memory usage percentage" })
  percentage: number;
}

export class RedisClientsDto {
  @ApiProperty({ description: "Number of connected clients" })
  connected: number;

  @ApiProperty({ description: "Number of blocked clients" })
  blocked: number;
}

export class RedisKeyspaceDto {
  @ApiProperty({ description: "Total number of keys" })
  totalKeys: number;

  @ApiProperty({
    description: "Key counts by pattern",
    type: "object",
    additionalProperties: { type: "number" },
  })
  byPattern: Record<string, number>;
}

export class RedisReplicationDto {
  @ApiProperty({ description: "Replication role", enum: ["master", "slave"] })
  role: "master" | "slave";

  @ApiProperty({
    description: "Number of connected slaves (if master)",
    required: false,
  })
  connectedSlaves?: number;
}

export class RedisHealthResponseDto {
  @ApiProperty({
    description: "Overall health status",
    enum: ["healthy", "unhealthy", "degraded"],
  })
  status: "healthy" | "unhealthy" | "degraded";

  @ApiProperty({ type: RedisConnectionDto })
  connection: RedisConnectionDto;

  @ApiProperty({ type: RedisMemoryDto })
  memory: RedisMemoryDto;

  @ApiProperty({ type: RedisClientsDto })
  clients: RedisClientsDto;

  @ApiProperty({ type: RedisKeyspaceDto })
  keyspace: RedisKeyspaceDto;

  @ApiProperty({ type: RedisReplicationDto, required: false })
  replication?: RedisReplicationDto;

  @ApiProperty({ description: "Timestamp of health check" })
  timestamp: string;
}

export class RedisStatsResponseDto {
  @ApiProperty({
    description: "Redis INFO command output",
    type: "object",
    additionalProperties: { type: "string" },
  })
  info: Record<string, string>;

  @ApiProperty({
    description: "Keyspace statistics",
    type: "object",
    additionalProperties: { type: "number" },
  })
  keyspace: Record<string, number>;

  @ApiProperty({
    description: "Key counts by pattern",
    type: "object",
    additionalProperties: { type: "number" },
  })
  patterns: Record<string, number>;
}
