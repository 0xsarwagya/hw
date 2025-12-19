"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";
import type { GenerateLabelRequest, GenerateLabelResponse } from "@/lib/types/shipping";

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useApiMutation<GenerateLabelResponse, GenerateLabelRequest>({
    mutationFn: async (data) => {
      // Use API route proxy for cookie handling
      return api.post<GenerateLabelResponse>("/api/shipping/shiprocket/shipments", data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.detail(variables.orderId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.shipping.listShipments] });
      toast.success(`Shipment created: ${data.awbNumber}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create shipment");
    },
  });
}

