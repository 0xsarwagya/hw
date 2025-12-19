import { Global, Module } from "@nestjs/common";
import { ContextModule } from "../../common/logging/context.module";
import { LoggerModule } from "../../common/logging/logger.module";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [LoggerModule, ContextModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
