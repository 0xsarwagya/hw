import { Global, Module } from "@nestjs/common";
import { LoggerModule } from "../../common/logging/logger.module";
import { ContextModule } from "../../common/logging/context.module";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [LoggerModule, ContextModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

