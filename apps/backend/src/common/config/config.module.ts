import { Global, Module } from "@nestjs/common";
import { AppConfigService } from "./app.config.service";

/**
 * Global configuration module
 * Provides centralized access to application configuration
 * This ensures configurable data is at high levels and follows dependency injection principles
 */
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
