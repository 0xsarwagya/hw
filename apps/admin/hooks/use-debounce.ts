import { useEffect, useState } from "react";
import { DEBOUNCE_DELAY_MS } from "@/lib/constants/common.constants";

/**
 * Hook for debouncing a value
 * Useful for search inputs and other inputs that trigger API calls
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (defaults to DEBOUNCE_DELAY_MS)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search);
 *
 * useEffect(() => {
 *   // API call with debouncedSearch
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DELAY_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
