"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";
import { useApiQuery } from "../use-api-query";

export interface OrderNote {
  id: string;
  orderId: string;
  note: string;
  isPublic: boolean;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderNoteParams {
  orderId: string;
  note: string;
  isPublic: boolean;
}

export function useAdminOrderNotes(orderId: string) {
  return useApiQuery<OrderNote[]>(endpoints.orders.notes(orderId), {
    enabled: !!orderId,
  });
}

export function useCreateOrderNote() {
  const queryClient = useQueryClient();

  return useApiMutation<OrderNote, CreateOrderNoteParams>({
    mutationFn: async ({ orderId, note, isPublic }) => {
      const url = `/api/orders/${orderId}/notes`;
      return api.post<OrderNote>(url, { note, isPublic });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.notes(data.orderId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.detail(data.orderId)],
      });
      toast.success("Note added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });
}

