"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

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

export function useRedisHealth() {
  return useApiQuery<RedisHealthStatus>(endpoints.redis.health, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRedisStats() {
  return useApiQuery<RedisStats>(endpoints.redis.stats, {
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useRedisKeys() {
  return useApiQuery<Record<string, number>>(endpoints.redis.keys, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
