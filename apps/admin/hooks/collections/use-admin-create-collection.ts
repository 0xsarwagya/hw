"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  Collection,
  CreateCollectionInput,
} from "@/lib/types/collections";
import { useApiMutation } from "../use-api-mutation";

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
