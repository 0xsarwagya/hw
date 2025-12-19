"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

/**
 * Hook for deleting a product
 *
 * Handles product deletion, cache invalidation, and navigation.
 * Shows success/error toasts and redirects to products list on success.
 *
 * @returns Mutation object with mutate and mutateAsync functions
 *
 * @example
 * ```tsx
 * const deleteProduct = useAdminDeleteProduct();
 *
 * await deleteProduct.mutateAsync(productId);
 * ```
 */
export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<{ message: string }, string>({
    mutationFn: async (productId: string) => {
      return api.delete<{ message: string }>(
        endpoints.products.delete(productId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.list] });
      toast.success("Product deleted successfully");
      router.push("/products");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}
