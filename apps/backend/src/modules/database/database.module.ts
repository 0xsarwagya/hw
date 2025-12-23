import { Global, Module } from "@nestjs/common";
import { db } from "@vcecom/db";
import { ContextModule } from "../../common/logging/context.module";
import { LoggerModule } from "../../common/logging/logger.module";
import { DatabaseService } from "./database.service";

// Token for database instance injection
export const DB_TOKEN = "DB";

@Global()
@Module({
  imports: [LoggerModule, ContextModule],
  providers: [
    DatabaseService,
    {
      provide: DB_TOKEN,
      useValue: db, // Single instance from @vcecom/db - NestJS ensures singleton
    },
  ],
  exports: [DatabaseService, DB_TOKEN], // Export DB_TOKEN so other modules can inject it
})
export class DatabaseModule {}
