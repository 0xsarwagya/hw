"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import { storeConfigSchema } from "@/lib/validations/store-config";

/**
 * Get store configuration
 */
export function useStoreConfig() {
  return useQuery({
    queryKey: ["store-config"],
    queryFn: async () => {
      const data = await get(endpoints.config.store);
      return storeConfigSchema.parse(data);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
