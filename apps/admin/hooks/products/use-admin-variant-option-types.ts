"use client";

import { endpoints } from "@/lib/endpoints";
import type { VariantOptionType } from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminVariantOptionTypes() {
  return useApiQuery<VariantOptionType[]>(endpoints.variantOptionTypes.list);
}
