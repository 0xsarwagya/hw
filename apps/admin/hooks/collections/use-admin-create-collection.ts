"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { CreateCollectionInput, Collection } from "@/lib/types/collections";
import { toast } from "sonner";

export function useAdminCreateCollection() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<Collection, CreateCollectionInput>({
    mutationFn: async (data) => {
      return api.post<Collection>(endpoints.collections.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.list] });
      toast.success("Collection created successfully");
      router.push(`/products/collections/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create collection");
    },
  });
}

