"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints, post } from "@/lib/api/client";
import {
  discountValidationResponseSchema,
  type ValidateDiscountInput,
  validateDiscountSchema,
} from "@/lib/validations/discount";

/**
 * Validate discount code
 */
export function useValidateDiscount() {
  return useMutation({
    mutationFn: async (input: ValidateDiscountInput) => {
      const validated = validateDiscountSchema.parse(input);
      const data = await post(endpoints.discounts.validate, validated);
      return discountValidationResponseSchema.parse(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid discount code");
    },
  });
}
