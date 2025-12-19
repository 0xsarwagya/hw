"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Configuration for syncing filter state with URL parameters
 */
export interface FilterSyncConfig<T extends Record<string, unknown>> {
  /**
   * Current filter state
   */
  filters: T;

  /**
   * Function to update filters
   */
  setFilters: (filters: T | ((prev: T) => T)) => void;

  /**
   * Base path for the route (e.g., "/products", "/orders")
   */
  basePath: string;

  /**
   * Function to serialize filter values to URL params
   * Return undefined to exclude the param from URL
   */
  serialize?: (key: keyof T, value: unknown) => string | undefined;

  /**
   * Function to deserialize URL params to filter values
   */
  deserialize?: (key: string, value: string) => unknown;

  /**
   * Keys to exclude from URL sync
   */
  excludeKeys?: (keyof T)[];
}

/**
 * Hook to synchronize filter state with URL search parameters
 *
 * This hook automatically:
 * - Reads initial filter values from URL params on mount
 * - Updates URL when filters change
 * - Handles serialization/deserialization of complex values
 *
 * @param config - Configuration object for filter sync
 *
 * @example
 * ```tsx
 * const { filters, setFilters } = useFilterSync({
 *   filters: productFilters,
 *   setFilters: setProductFilters,
 *   basePath: "/products",
 *   excludeKeys: ["page"], // Don't sync page to URL
 * });
 * ```
 */
export function useFilterSync<T extends Record<string, unknown>>(
  config: FilterSyncConfig<T>,
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    setFilters,
    basePath,
    serialize = (_, value) => {
      if (value === undefined || value === null || value === "")
        return undefined;
      return String(value);
    },
    deserialize = (_, value) => value,
    excludeKeys = [],
  } = config;

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters: Partial<T> = {};
    let hasUrlFilters = false;

    searchParams.forEach((value, key) => {
      if (!excludeKeys.includes(key as keyof T)) {
        urlFilters[key as keyof T] = deserialize(key, value) as T[keyof T];
        hasUrlFilters = true;
      }
    });

    if (hasUrlFilters) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [deserialize, excludeKeys.includes, searchParams.forEach, setFilters]); // Only run on mount

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (excludeKeys.includes(key as keyof T)) return;

      const serialized = serialize(key as keyof T, value);
      if (serialized !== undefined) {
        params.set(key, serialized);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath;

    router.replace(newUrl, { scroll: false });
  }, [filters, basePath, router, serialize, excludeKeys]);

  return { filters, setFilters };
}
