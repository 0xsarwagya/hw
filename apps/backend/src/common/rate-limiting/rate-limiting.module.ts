import { Module } from "@nestjs/common";
import { RedisStoreModule } from "../../modules/redis-store/redis-store.module";
import { RateLimitGuard } from "../guards/rate-limit.guard";
import { RateLimitInterceptor } from "../interceptors/rate-limit.interceptor";
import { ContextModule } from "../logging/context.module";
import { LoggerModule } from "../logging/logger.module";
import { RateLimitService } from "./rate-limit.service";

@Module({
  imports: [RedisStoreModule, LoggerModule, ContextModule],
  providers: [RateLimitService, RateLimitGuard, RateLimitInterceptor],
  exports: [RateLimitService, RateLimitGuard, RateLimitInterceptor],
})
export class RateLimitingModule {}
