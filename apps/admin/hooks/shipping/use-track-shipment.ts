"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { TrackShipmentResponse } from "@/lib/types/shipping";

export function useTrackShipment(awb: string, enabled = true) {
  return useApiQuery<TrackShipmentResponse>(endpoints.shipping.trackShipment(awb), {
    enabled: enabled && !!awb,
  });
}

