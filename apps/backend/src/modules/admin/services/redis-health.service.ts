import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";

export interface RedisHealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  connection: {
    status: "connected" | "disconnected" | "error";
    latency?: number;
  };
  memory: {
    used: number;
    peak: number;
    total: number;
    percentage: number;
  };
  clients: {
    connected: number;
    blocked: number;
  };
  keyspace: {
    totalKeys: number;
    byPattern: Record<string, number>;
  };
  replication?: {
    role: "master" | "slave";
    connectedSlaves?: number;
  };
  timestamp: string;
}

export interface RedisStats {
  info: Record<string, string>;
  keyspace: Record<string, number>;
  patterns: Record<string, number>;
}

@Injectable()
export class RedisHealthService {
  constructor(
    private readonly redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Get comprehensive Redis health status
   */
  async getHealth(): Promise<RedisHealthStatus> {
    try {
      const client = await this.redisStoreService.getClient();

      // Test connection with ping
      const pingStart = Date.now();
      await client.ping();
      const latency = Date.now() - pingStart;

      // Get INFO command results
      const memoryInfo = await client.info("memory");
      const clientsInfo = await client.info("clients");
      const keyspaceInfo = await client.info("keyspace");
      const replicationInfo = await client.info("replication");

      // Parse memory info
      const memoryData = this.parseInfo(memoryInfo);
      const usedMemory = parseInt(memoryData.used_memory || "0", 10);
      const peakMemory = parseInt(memoryData.used_memory_peak || "0", 10);
      const maxMemory = parseInt(memoryData.maxmemory || "0", 10);
      const memoryPercentage =
        maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;

      // Parse clients info
      const clientsData = this.parseInfo(clientsInfo);
      const connectedClients = parseInt(
        clientsData.connected_clients || "0",
        10,
      );
      const blockedClients = parseInt(clientsData.blocked_clients || "0", 10);

      // Parse keyspace info
      const keyspaceData = this.parseKeyspace(keyspaceInfo);
      const totalKeys = Object.values(keyspaceData).reduce(
        (sum, count) => sum + count,
        0,
      );

      // Get key counts by pattern
      const keyPatterns = await this.getKeyCountsByPattern(client);

      // Parse replication info
      const replicationData = this.parseInfo(replicationInfo);
      const replication =
        replicationData.role === "master" || replicationData.role === "slave"
          ? {
              role: replicationData.role as "master" | "slave",
              connectedSlaves:
                replicationData.role === "master"
                  ? parseInt(replicationData.connected_slaves || "0", 10)
                  : undefined,
            }
          : undefined;

      // Determine overall status
      let status: "healthy" | "unhealthy" | "degraded" = "healthy";
      if (latency > 1000) {
        status = "degraded";
      }
      if (memoryPercentage > 90) {
        status = "degraded";
      }
      if (latency > 5000 || memoryPercentage > 95) {
        status = "unhealthy";
      }

      return {
        status,
        connection: {
          status: "connected",
          latency,
        },
        memory: {
          used: usedMemory,
          peak: peakMemory,
          total: maxMemory || 0,
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
        clients: {
          connected: connectedClients,
          blocked: blockedClients,
        },
        keyspace: {
          totalKeys,
          byPattern: keyPatterns,
        },
        replication,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getRedisHealth", error),
        "Failed to get Redis health",
      );
      return {
        status: "unhealthy",
        connection: {
          status: "error",
        },
        memory: {
          used: 0,
          peak: 0,
          total: 0,
          percentage: 0,
        },
        clients: {
          connected: 0,
          blocked: 0,
        },
        keyspace: {
          totalKeys: 0,
          byPattern: {},
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed Redis statistics
   */
  async getStats(): Promise<RedisStats> {
    try {
      const client = await this.redisStoreService.getClient();

      const info = await client.info("all");
      const keyspaceInfo = await client.info("keyspace");

      const infoData = this.parseInfo(info);
      const keyspaceData = this.parseKeyspace(keyspaceInfo);

      // Get key counts by common patterns
      const patterns = await this.getKeyCountsByPattern(client);

      return {
        info: infoData,
        keyspace: keyspaceData,
        patterns,
      };
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getRedisStats", error),
        "Failed to get Redis stats",
      );
      throw error;
    }
  }

  /**
   * Get key counts by pattern
   */
  private async getKeyCountsByPattern(
    client: Redis,
  ): Promise<Record<string, number>> {
    const patterns = [
      "inventory:variant:*",
      "checkout:*",
      "cart:*",
      "pricing:*",
      "discount:*",
      "session:*",
      "job:*",
    ];

    const counts: Record<string, number> = {};

    for (const pattern of patterns) {
      try {
        let cursor = "0";
        let total = 0;

        do {
          const [nextCursor, keys] = await client.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            1000,
          );
          cursor = nextCursor;
          total += keys.length;
        } while (cursor !== "0");

        counts[pattern] = total;
      } catch (error) {
        this.logger.warn(
          createLogContext(this.contextService, "getKeyCountsByPattern", {
            pattern,
            error: error instanceof Error ? error.message : String(error),
          }),
          `Failed to count keys for pattern: ${pattern}`,
        );
        counts[pattern] = 0;
      }
    }

    return counts;
  }

  /**
   * Parse INFO command output
   */
  private parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split("\r\n");

    for (const line of lines) {
      if (line && !line.startsWith("#") && line.includes(":")) {
        const [key, ...valueParts] = line.split(":");
        const value = valueParts.join(":");
        if (key && value) {
          result[key.trim()] = value.trim();
        }
      }
    }

    return result;
  }

  /**
   * Parse keyspace INFO output
   */
  private parseKeyspace(keyspace: string): Record<string, number> {
    const result: Record<string, number> = {};
    const lines = keyspace.split("\r\n");

    for (const line of lines) {
      if (line.startsWith("db")) {
        const match = line.match(/^db(\d+):keys=(\d+)/);
        if (match) {
          const dbIndex = match[1];
          const keyCount = parseInt(match[2], 10);
          result[`db${dbIndex}`] = keyCount;
        }
      }
    }

    return result;
  }
}
