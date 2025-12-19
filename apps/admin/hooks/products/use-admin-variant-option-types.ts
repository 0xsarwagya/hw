"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { VariantOptionType } from "@/lib/types/products";

export function useAdminVariantOptionTypes() {
  return useApiQuery<VariantOptionType[]>(endpoints.variantOptionTypes.list);
}

