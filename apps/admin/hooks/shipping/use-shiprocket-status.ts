"use client";

import type { ShiprocketStatus } from "@/lib/types/shipping";
import { useApiQuery } from "../use-api-query";

export function useShiprocketStatus() {
  // Use API route proxy for cookie handling
  return useApiQuery<ShiprocketStatus>("/api/shipping/shiprocket/status");
}
