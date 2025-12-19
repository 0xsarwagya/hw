"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteCollection() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<{ message: string }, string>({
    mutationFn: async (collectionId: string) => {
      return api.delete<{ message: string }>(
        endpoints.collections.delete(collectionId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.list] });
      toast.success("Collection deleted successfully");
      router.push("/products/collections");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete collection");
    },
  });
}
