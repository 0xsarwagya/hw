import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { createLogContext } from "../../../common/logging/logging.helper";

/**
 * Profiler metrics interface
 */
export interface ProfilerMetrics {
  rulesetVersion: number;
  rulesCount: number;
  bundleSizeKB: number;
  avgEngineRuntimeMs: number;
  redisLatencyMs: number;
  cacheHitRate: number;
  lastHotReloadAt: Date | null;
  totalEngineRuns: number;
  totalRulesApplied: number;
}

/**
 * Service for profiling discount engine performance and hot reload metrics
 */
@Injectable()
export class DiscountProfiler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  // Metrics storage
  private engineRuns: number[] = []; // Runtime in ms
  private redisLatencies: number[] = []; // Latency in ms
  private cacheHits = 0;
  private cacheMisses = 0;
  private totalRulesApplied = 0;
  private lastHotReloadAt: Date | null = null;
  private currentRulesetVersion = 0;
  private currentRulesCount = 0;
  private currentBundleSizeKB = 0;

  // Keep only last 1000 measurements for rolling average
  private readonly MAX_MEASUREMENTS = 1000;

  /**
   * Record an engine run
   */
  recordEngineRun(
    version: number,
    runtimeMs: number,
    rulesApplied: number,
    cacheHit: boolean,
  ): void {
    this.engineRuns.push(runtimeMs);
    if (this.engineRuns.length > this.MAX_MEASUREMENTS) {
      this.engineRuns.shift();
    }

    this.totalRulesApplied += rulesApplied;
    this.currentRulesetVersion = version;

    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Record Redis latency
   */
  recordRedisLatency(latencyMs: number): void {
    this.redisLatencies.push(latencyMs);
    if (this.redisLatencies.length > this.MAX_MEASUREMENTS) {
      this.redisLatencies.shift();
    }
  }

  /**
   * Record hot reload event
   */
  recordHotReload(version: number): void {
    this.lastHotReloadAt = new Date();
    this.currentRulesetVersion = version;
    this.logger.info(
      createLogContext(this.contextService, "recordHotReload", { version }),
      "Hot reload recorded",
    );
  }

  /**
   * Update bundle metadata
   */
  updateBundleMetadata(
    version: number,
    rulesCount: number,
    bundleSizeKB: number,
  ): void {
    this.currentRulesetVersion = version;
    this.currentRulesCount = rulesCount;
    this.currentBundleSizeKB = bundleSizeKB;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProfilerMetrics {
    const avgEngineRuntime =
      this.engineRuns.length > 0
        ? this.engineRuns.reduce((a, b) => a + b, 0) / this.engineRuns.length
        : 0;

    const avgRedisLatency =
      this.redisLatencies.length > 0
        ? this.redisLatencies.reduce((a, b) => a + b, 0) /
          this.redisLatencies.length
        : 0;

    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    return {
      rulesetVersion: this.currentRulesetVersion,
      rulesCount: this.currentRulesCount,
      bundleSizeKB: this.currentBundleSizeKB,
      avgEngineRuntimeMs: parseFloat(avgEngineRuntime.toFixed(2)),
      redisLatencyMs: parseFloat(avgRedisLatency.toFixed(2)),
      cacheHitRate: parseFloat((cacheHitRate * 100).toFixed(2)),
      lastHotReloadAt: this.lastHotReloadAt,
      totalEngineRuns: this.engineRuns.length,
      totalRulesApplied: this.totalRulesApplied,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.engineRuns = [];
    this.redisLatencies = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalRulesApplied = 0;
    this.lastHotReloadAt = null;
    this.currentRulesetVersion = 0;
    this.currentRulesCount = 0;
    this.currentBundleSizeKB = 0;
  }
}
