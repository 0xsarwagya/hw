"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  Collection,
  UpdateCollectionInput,
} from "@/lib/types/collections";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Collection, UpdateCollectionInput>({
    mutationFn: async (data) => {
      return api.put<Collection>(
        endpoints.collections.update(collectionId),
        data,
      );
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.collections.detail(collectionId)],
      });
      toast.success("Collection updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update collection");
    },
  });
}
