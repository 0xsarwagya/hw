import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { closeDatabasePool, getPoolStats, isPoolHealthy } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../common/logging/logging.helper";

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  async onModuleInit() {
    // Log pool status on startup
    // Note: getPoolStats() doesn't trigger pool creation - pool is created lazily
    // This is safe to call during initialization
    try {
      const stats = getPoolStats();
      if (stats) {
        this.logger.info(
          createLogContext(this.contextService, "databasePoolInit", {
            totalConnections: stats.totalCount,
            idleConnections: stats.idleCount,
            waitingConnections: stats.waitingCount,
          }),
          "Database connection pool initialized",
        );
      } else {
        this.logger.info(
          createLogContext(this.contextService, "databasePoolInit", {}),
          "Database pool not yet created (lazy initialization)",
        );
      }
    } catch (error) {
      this.logger.warn(
        createErrorContext(this.contextService, "databasePoolInit", error),
        "Failed to get database pool stats - pool may not be initialized yet",
      );
      // Don't throw - allow app to start
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.info(
      createLogContext(this.contextService, "databaseShutdown", { signal }),
      "Shutting down database connection pool",
    );

    // Log pool status before shutdown
    const statsBefore = getPoolStats();
    if (statsBefore) {
      this.logger.info(
        createLogContext(this.contextService, "databasePoolStatsBefore", {
          totalConnections: statsBefore.totalCount,
          idleConnections: statsBefore.idleCount,
          waitingConnections: statsBefore.waitingCount,
        }),
        "Database pool statistics before shutdown",
      );
    }

    try {
      // Close pool gracefully with 10 second timeout
      await closeDatabasePool(10000);

      this.logger.info(
        createLogContext(this.contextService, "databaseShutdownComplete", {}),
        "Database connection pool closed successfully",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "databaseShutdownError", error),
        "Error closing database connection pool",
      );
      // Don't throw - allow application to continue shutdown
    }
  }

  /**
   * Get current database pool health status
   */
  getHealthStatus(): {
    healthy: boolean;
    stats: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    } | null;
  } {
    return {
      healthy: isPoolHealthy(),
      stats: getPoolStats(),
    };
  }
}
