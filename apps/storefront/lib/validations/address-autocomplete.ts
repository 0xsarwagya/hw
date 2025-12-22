import { z } from "zod";

/**
 * Address autocomplete validation schemas matching backend DTOs
 */

export const stateSuggestionSchema = z.object({
  name: z.string(),
  code: z.string(),
  districtCount: z.number(),
});

export const districtSuggestionSchema = z.object({
  name: z.string(),
  state: z.string(),
  stateCode: z.string(),
  pincodeCount: z.number(),
});

export const stateAutocompleteResponseSchema = z.object({
  states: z.array(stateSuggestionSchema),
  total: z.number(),
});

export const districtAutocompleteResponseSchema = z.object({
  districts: z.array(districtSuggestionSchema),
  total: z.number(),
});

export type StateSuggestion = z.infer<typeof stateSuggestionSchema>;
export type DistrictSuggestion = z.infer<typeof districtSuggestionSchema>;
export type StateAutocompleteResponse = z.infer<
  typeof stateAutocompleteResponseSchema
>;
export type DistrictAutocompleteResponse = z.infer<
  typeof districtAutocompleteResponseSchema
>;
