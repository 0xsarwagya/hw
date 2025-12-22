"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import {
  districtAutocompleteResponseSchema,
  districtSuggestionSchema,
  stateAutocompleteResponseSchema,
  stateSuggestionSchema,
} from "@/lib/validations/address-autocomplete";

/**
 * Get state suggestions
 */
export function useStateSuggestions(query: string, limit = 10) {
  return useQuery({
    queryKey: ["address-autocomplete", "states", query, limit],
    queryFn: async () => {
      const url = `${endpoints.addressAutocomplete.states}?query=${encodeURIComponent(query)}&limit=${limit}`;
      const data = await get(url);
      return stateAutocompleteResponseSchema.parse(data);
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get all states
 */
export function useAllStates() {
  return useQuery({
    queryKey: ["address-autocomplete", "states", "all"],
    queryFn: async () => {
      const data = await get(endpoints.addressAutocomplete.allStates);
      return Array.isArray(data)
        ? data.map((s) => stateSuggestionSchema.parse(s))
        : [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get district suggestions
 */
export function useDistrictSuggestions(
  query: string,
  state?: string,
  limit = 10,
) {
  return useQuery({
    queryKey: ["address-autocomplete", "districts", query, state, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("query", query);
      if (state) searchParams.set("state", state);
      searchParams.set("limit", limit.toString());
      const url = `${endpoints.addressAutocomplete.districts}?${searchParams.toString()}`;
      const data = await get(url);
      return districtAutocompleteResponseSchema.parse(data);
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get districts by state
 */
export function useDistrictsByState(state: string) {
  return useQuery({
    queryKey: ["address-autocomplete", "districts", "by-state", state],
    queryFn: async () => {
      const url = `${endpoints.addressAutocomplete.districtsByState}?state=${encodeURIComponent(state)}`;
      const data = await get(url);
      return Array.isArray(data)
        ? data.map((d) => districtSuggestionSchema.parse(d))
        : [];
    },
    enabled: !!state,
    staleTime: 30 * 60 * 1000,
  });
}
