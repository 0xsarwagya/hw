"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";
import type { Order } from "@/lib/types/orders";

interface ReconcilePaymentIntentParams {
  paymentIntentId: string;
  provider?: string;
}

export function useAdminPaymentReconcile() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, ReconcilePaymentIntentParams>({
    mutationFn: async ({ paymentIntentId, provider }) => {
      // Use API route proxy for cookie handling
      const url = `/api/orders/reconcile/${paymentIntentId}`;
      const params = provider ? { provider } : undefined;
      return api.post<Order>(url, undefined, { params });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.detail(data.id)] });
      toast.success("Order reconciled successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reconcile payment intent");
    },
  });
}

