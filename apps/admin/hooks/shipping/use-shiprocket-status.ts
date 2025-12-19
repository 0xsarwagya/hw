"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { ShiprocketStatus } from "@/lib/types/shipping";

export function useShiprocketStatus() {
  // Use API route proxy for cookie handling
  return useApiQuery<ShiprocketStatus>("/api/shipping/shiprocket/status");
}

