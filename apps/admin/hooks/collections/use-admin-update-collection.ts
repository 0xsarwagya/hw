"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Collection, UpdateCollectionInput } from "@/lib/types/collections";
import { toast } from "sonner";

export function useAdminUpdateCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Collection, UpdateCollectionInput>({
    mutationFn: async (data) => {
      return api.put<Collection>(endpoints.collections.update(collectionId), data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.detail(collectionId)] });
      toast.success("Collection updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update collection");
    },
  });
}

