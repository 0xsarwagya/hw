"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Order } from "@/lib/types/orders";
import { useApiMutation } from "../use-api-mutation";
import { useApiQuery } from "../use-api-query";

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason?: string;
  status: "pending" | "completed" | "failed";
  refundProviderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRefundParams {
  orderId: string;
  amount: number;
  reason?: string;
  initiatePaymentRefund?: boolean;
}

export function useAdminRefunds(orderId: string) {
  return useApiQuery<Refund[]>(`/api/orders/${orderId}/refunds`, {
    enabled: !!orderId,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();

  return useApiMutation<Refund, CreateRefundParams>({
    mutationFn: async ({ orderId, amount, reason, initiatePaymentRefund }) => {
      const url = `/api/orders/${orderId}/refund`;
      return api.post<Refund>(url, {
        amount,
        reason,
        initiatePaymentRefund,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.detail(data.orderId)],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${data.orderId}/refunds`],
      });
      toast.success("Refund created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create refund");
    },
  });
}

