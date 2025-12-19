"use client";

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { CreateDiscountInput, Discount } from "@/lib/types/discounts";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateDiscount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<Discount, CreateDiscountInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<Discount>(endpoints.discounts.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.discounts.list] });
      toast.success("Discount created successfully");
      router.push(`/discounts/${data.id}`);
    },
    onError: (error) => {
      // Show field-level errors if available
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create discount");
      }
      // Re-throw to allow form to handle it
      throw error;
    },
  });
}
