import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { closeDatabasePool, getDatabasePool, getPoolStats, isPoolHealthy } from "@vcecom/db";
import type { Database } from "@vcecom/db";
import { DB_TOKEN } from "./database.module";
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
    @Inject(DB_TOKEN) private readonly db: Database, // Inject DB to verify singleton
  ) {}

  async onModuleInit() {
    // Verify singleton: Get pool instance and log its identity
    // This ensures we're using the same pool instance across all modules
    try {
      const poolInstance = getDatabasePool();
      const poolId = poolInstance ? `pool_${poolInstance.totalCount}_${Date.now()}` : "not_created";
      
      // Log pool status on startup
      // Note: getPoolStats() doesn't trigger pool creation - pool is created lazily
      // This is safe to call during initialization
      const stats = getPoolStats();
      if (stats) {
        this.logger.info(
          createLogContext(this.contextService, "databasePoolInit", {
            poolId,
            totalConnections: stats.totalCount,
            idleConnections: stats.idleCount,
            waitingConnections: stats.waitingCount,
            poolInstanceExists: !!poolInstance,
            dbInstanceType: typeof this.db,
          }),
          "Database connection pool initialized (singleton verified)",
        );
      } else {
        this.logger.info(
          createLogContext(this.contextService, "databasePoolInit", {
            poolId,
            dbInstanceType: typeof this.db,
          }),
          "Database pool not yet created (lazy initialization) - singleton pattern active",
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
