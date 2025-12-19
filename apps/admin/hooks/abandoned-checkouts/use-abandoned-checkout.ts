"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { AbandonedCheckout } from "@/lib/types/abandoned-checkouts";

export function useAbandonedCheckout(cartId: string, enabled = true) {
  return useApiQuery<AbandonedCheckout>(endpoints.abandonedCheckouts.detail(cartId), {
    enabled: enabled && !!cartId,
  });
}

